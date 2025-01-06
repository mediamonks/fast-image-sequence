import Frame from "./Frame.js";
import {createLogElement, logToScreen} from "./LogToScreen.js";
import ImageSource, {type ImageSourceOptions, INPUT_CODE, INPUT_SRC} from "./ImageSource.js";
import ImageSourceTar from "./ImageSourceTar.js";
import ImageSourceFetch from "./ImageSourceFetch.js";

export function isMobile(): boolean {
  return (typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type FastImageSequenceDisplayOptions = {
  objectFit: 'contain' | 'cover';
  horizontalAlign: number;
  verticalAlign: number;
}

/**
 * @typedef FastImageSequenceOptions
 *
 * This type represents the options for the FastImageSequence class.
 *
 * @property {number} frames - The number of frames in the image sequence.
 * @property {ImageSourceOptions[] | ImageSourceOptions} src - The source of the images for the FastImageSequence class. It can either be an array of ImageSourceOptions or a single ImageSourceOptions instance.
 * @property {boolean} [loop=false] - Whether the sequence should loop back to the start when it reaches the end.
 * @property {string | undefined} [poster] - The URL of the poster image to be displayed before the sequence loads.
 * @property {string} [fillStyle='#00000000'] - The fill style of the canvas. This is a color in any valid CSS color format.
 * @property {boolean} [clearCanvas=false] - Whether to clear the canvas before drawing each frame.
 * @property {boolean} [showDebugInfo=false] - Whether to display debug information.
 * @property {string} [name='FastImageSequence'] - The name of the FastImageSequence instance.
 * @property {FastImageSequenceDisplayOptions} [objectFit='cover'] - How the image should be resized to fit the canvas. It can be either 'contain' or 'cover'.
 * @property {number} [horizontalAlign=0.5] - The horizontal alignment of the image. It should be a number between 0 and 1.
 * @property {number} [verticalAlign=0.5] - The vertical alignment of the image. It should be a number between 0 and 1.
 */
export type FastImageSequenceOptions = {
  frames: number,
  src: Partial<ImageSourceOptions>[] | Partial<ImageSourceOptions>,
} & Partial<{
  loop: boolean;
  poster: string | undefined;
  fillStyle: string;
  clearCanvas: boolean,
  showDebugInfo: boolean,
  name: string,
}> & Partial<FastImageSequenceDisplayOptions>;

export class FastImageSequence {
  private static defaultOptions: Required<FastImageSequenceOptions> = {
    frames:          1,
    src:             [],
    loop:            false,
    poster:          undefined,
    fillStyle:       '#00000000',
    objectFit:       'cover',
    clearCanvas:     false, // clear canvas before drawing
    showDebugInfo:   false,
    name:            'FastImageSequence',
    horizontalAlign: 0.5,
    verticalAlign:   0.5,
  };
  public canvas: HTMLCanvasElement;
  public options: Required<FastImageSequenceOptions>;
  public width: number = 0;
  public height: number = 0;
  public frame: number = 0;
  public log: (...args: any[]) => void;
  public frames: Frame[] = [];
  public sources: ImageSource[] = [];

  private context: CanvasRenderingContext2D;
  private tickFunctions: ((dt: number) => void) [] = [];
  private startTime: number = -1;
  private animationRequestId: number = 0;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;
  private mutationObserver: MutationObserver;
  private inViewportObserver: IntersectionObserver;
  private clearCanvas: boolean = true;
  private speed: number = 0;
  private prevFrame: number = 0;
  private direction: number = 1;
  private lastFrameDrawn: number = -1;
  private destructed: boolean = false;
  private logElement: HTMLElement | undefined;
  private initialized: boolean = false;
  private posterImage: HTMLImageElement | undefined;
  private timeFrameVisible: number = 0;

  private inViewport: boolean = false;
  private containerWidth: number = 0;
  private containerHeight: number = 0;

  /**
   * Creates an instance of FastImageSequence.
   *
   * @param {HTMLElement} container - The HTML element where the image sequence will be displayed.
   * @param {FastImageSequenceOptions} options - The options for the image sequence.
   *
   * @throws {Error} If the number of frames is less than or equal to 0.
   */
  constructor(
    container: HTMLElement,
    options: FastImageSequenceOptions,
  ) {
    this.options = {...FastImageSequence.defaultOptions, ...options};

    if (this.options.frames <= 0) {
      throw new Error('FastImageSequence: frames must be greater than 0');
    }

    this.container = container;

    this.canvas = document.createElement('canvas');
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');
    this.context.fillStyle = this.options.fillStyle;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    Object.assign(this.canvas.style, {
      inset:   '0',
      width:   '100%',
      height:  '100%',
      margin:  '0',
      display: 'block',
    });

    this.container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => {
      this.clearCanvas = true;
      this.containerWidth = container.offsetWidth;
      this.containerHeight = container.offsetHeight;
      if (this.lastFrameDrawn < 0 && this.posterImage) {
        this.drawImage(this.posterImage);
      }
    });
    this.resizeObserver.observe(this.canvas);

    this.mutationObserver = new MutationObserver(() => {
      if (!this.container.isConnected) {
        console.error('FastImageSequence: container is not connected to the DOM, fast image sequence will be destroyed');
        this.destruct();
      }
    });
    this.mutationObserver.observe(container, {childList: true});

    this.inViewportObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.inViewport = entry.isIntersecting;
      });
    });
    this.inViewportObserver.observe(this.canvas);

    // init all frames
    this.frames = Array.from({length: this.options.frames}, (_, index) => new Frame(index));
    this.log = this.options.showDebugInfo ? console.log : () => {
    };

    // init all input sources
    const sources = this.options.src instanceof Array ? this.options.src : [this.options.src];
    this.sources = sources.map((src, index) => {
      if (src.tarURL !== undefined) {
        return new ImageSourceTar(this, index, src);
      } else if (src.imageURL !== undefined) {
        return new ImageSourceFetch(this, index, src);
      } else {
        return new ImageSource(this, index, src);
      }
    });

    this.loadResources().then(() => {
      this.initialized = true;

      this.log('Frames', this.frames);
      this.log('Options', this.options);

      if (this.options.showDebugInfo) {
        this.logElement = createLogElement();
        this.container.appendChild(this.logElement);
        this.tick(() => this.logDebugStatus(this.logElement as HTMLDivElement));
      }

      this.drawingLoop(-1);
    });
  }

  /**
   * Get whether the image sequence is playing.
   */
  public get playing(): boolean {
    return this.speed !== 0;
  }

  /**
   * Get whether the image sequence is paused.
   */
  public get paused(): boolean {
    return !this.playing;
  }

  /**
   * Get the current progress of the image sequence loading.
   */
  public get loadProgress(): number {
    return this.sources.reduce((acc, source) => acc + source.getLoadStatus().progress, 0) / this.sources.length;
  }

  /**
   * Get the current progress of the image sequence.
   * @returns {number} - The current progress of the image sequence.
   */
  public get progress(): number {
    return this.index / (this.options.frames - 1);
  }

  /**
   * Set the current progress of the image sequence.
   * @param {number} value - The progress value to set.
   */
  public set progress(value: number) {
    this.frame = (this.options.frames - 1) * value;
  }

  /**
   * Get the first ImageSource from the sources array.
   * @returns {ImageSource} - The first ImageSource object in the sources array.
   */
  public get src() {
    return this.sources[0] as ImageSource;
  }

  private get index(): number {
    return this.wrapIndex(this.frame);
  }

  /**
   * Returns a promise that resolves when the image sequence is ready to play.
   */
  public ready(): Promise<void> {
    // check if the sequence is initialized
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.sources.every(source => source.initialized)) {
          resolve();
        } else {
          setTimeout(checkInitialized, 16);
        }
      };
      checkInitialized();
    });
  }

  /**
   * Register a tick function to be called on every frame update.
   *
   * @param func - The function to be called.
   */
  public tick(func: (dt: number) => void) {
    this.tickFunctions.push(func);
  }

  /**
   * Start playing the image sequence at a specified frame rate.
   * @param {number} [fps=30] - The frame rate to play the sequence at.
   */
  public play(fps: number = 30) {
    this.speed = fps;
  }

  /**
   * Stop playing the image sequence.
   */
  public stop() {
    this.speed = 0;
  }

  /**
   * Get the image of a specific frame.
   * @param {number} index - The index of the frame.
   * @returns {Promise<HTMLImageElement | ImageBitmap | undefined>} - A promise that resolves with the image of the frame.
   */
  public async getFrameImage(index: number): Promise<CanvasImageSource | undefined> {
    return await (this.frames[this.wrapIndex(index)] as Frame).fetchImage();
  }

  /**
   * Register a callback function that is called with the progress of the loading.
   * The function returns a promise that resolves when progress reaches 1.
   * @param onProgress - A callback function that is called with the progress of the loading.
   */
  public async onLoadProgress(onProgress?: (progress: number) => void): Promise<boolean> {
    let loadProgress = this.loadProgress;
    return new Promise((resolve) => {
      const checkProgress = () => {
        if (this.loadProgress >= 1) {
          if (onProgress) {
            onProgress(1);
          }
          resolve(true);
        } else {
          if (onProgress && loadProgress !== this.loadProgress) {
            onProgress(this.loadProgress);
            loadProgress = this.loadProgress;
          }
          setTimeout(checkProgress, 16);
        }
      };
      checkProgress();
    });
  }

  /**
   * Destruct the FastImageSequence instance.
   */
  public destruct() {
    if (this.destructed) {
      return;
    }
    this.destructed = true;

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }

    this.resizeObserver.disconnect();
    this.mutationObserver.disconnect();
    this.inViewportObserver.disconnect();

    this.container.removeChild(this.canvas);
    if (this.logElement) {
      this.container.removeChild(this.logElement);
      this.logElement = undefined;
    }
    this.canvas.replaceWith(this.canvas.cloneNode(true));
    this.sources.forEach(source => source.destruct());
    this.frames.forEach(frame => frame.releaseImage());
  }

  /**
   * Set the size and alignment of the image sequence on the canvas.
   *
   * @param {Partial<FastImageSequenceDisplayOptions>} options - An object containing the size and alignment options.
   * @property {string} options.objectFit - How the image should be resized to fit the canvas. It can be either 'contain' or 'cover'.
   * @property {number} options.horizontalAlign - The horizontal alignment of the image. It should be a number between 0 and 1.
   * @property {number} options.verticalAlign - The vertical alignment of the image. It should be a number between 0 and 1.
   */
  public setDisplayOptions(options: Partial<FastImageSequenceDisplayOptions>) {
    this.options = {...this.options, ...options};
    this.clearCanvas = true;
  }

  private setLoadingPriority() {
    const priorityIndex = this.index;// this.wrapIndex(Math.min(this.spread / 2 - 2, (this.frame - this.prevFrame) * (dt * 60)) + this.frame);
    this.frames.forEach((image) => {
      image.priority = Math.abs(image.index + 0.25 - priorityIndex);
      if (this.options.loop) {
        image.priority = Math.min(image.priority, this.options.frames - image.priority);
      }
    });
  }

  private async loadResources() {
    if (this.options.poster) {
      this.log('Poster image', this.options.poster);
      const posterImage = new Image();
      posterImage.src = this.options.poster;
      await posterImage.decode().then(() => {
        this.posterImage = posterImage;
        if (this.lastFrameDrawn < 0) {
          this.drawImage(this.posterImage);
        }
      }).catch((e) => this.log(e));
    }
    await Promise.all(this.sources.map(src => src.loadResources()));
    await this.getFrameImage(0);
  }

  private wrapIndex(frame: number) {
    const index = frame | 0;
    return this.wrapFrame(index);
  }

  private wrapFrame(index: number) {
    if (this.options.loop) {
      return ((index % this.options.frames) + this.options.frames) % this.options.frames;
    } else {
      return clamp(index, 0, this.options.frames - 1);
    }
  }

  private async drawingLoop(time: number = 0) {
    if (this.destructed) {
      return;
    }

    time /= 1000;

    const dt = this.initialized ? this.startTime < 0 ? 1 / 60 : Math.min(time - this.startTime, 1 / 30) : 0;
    this.startTime = time > 0 ? time : -1;

    if (this.frame - this.prevFrame < 0) this.direction = -1;
    if (this.frame - this.prevFrame > 0) this.direction = 1;

    this.frame += this.speed * dt;
    this.frame = this.wrapFrame(this.frame);


    if (this.inViewport) {
      const index = this.index;
      // find the best matching loaded frame, based on current index and direction
      // first set some sort of priority
      this.frames.forEach((frame) => {
        frame.priority = Math.abs(frame.index - index);
        let direction = Math.sign(this.frame - this.prevFrame);
        if (this.options.loop) {
          const wrappedPriority = this.options.frames - frame.priority;
          if (wrappedPriority < frame.priority) {
            frame.priority = wrappedPriority;
            // direction *= -1;
          }
        }
        frame.priority += this.direction * direction === -1 ? this.frames.length : 0;
      });
      this.frames.sort((a, b) => b.priority - a.priority);

      // best loaded image
      const bestImageMatch = this.frames.filter(a => a.image !== undefined).pop();
      if (bestImageMatch) {
        this.drawFrame(bestImageMatch);
      }
    }

    if (this.wrapIndex(this.frame) === this.wrapIndex(this.prevFrame)) {
      this.timeFrameVisible += dt;
    } else {
      this.timeFrameVisible = 0;
    }

    this.process();

    this.tickFunctions.forEach(func => func(dt));

    this.prevFrame = this.frame;
    this.animationRequestId = requestAnimationFrame(time => this.drawingLoop(time));
  }

  private drawFrame(frame: Frame) {
    const image = frame.image;
    if (!image) {
      return;
    }

    this.lastFrameDrawn = frame.index;
    // this.canvas.setAttribute('data-frame', frame.index.toString());
    this.drawImage(image);
  }

  private drawImage(image: CanvasImageSource) {
    // @ts-ignore
    const imageWidth = image.naturalWidth || image.width || image.videoWidth;
    // @ts-ignore
    const imageHeight = image.naturalHeight || image.height || image.videoHeight;

    const containerAspect = this.containerWidth / this.containerHeight;
    const imageAspect = imageWidth / imageHeight;

    this.width = Math.max(this.width, imageWidth);
    this.height = Math.max(this.height, imageHeight);

    if (this.options.objectFit === 'contain') {
      // contain
      const canvasWidth = (containerAspect > imageAspect ? this.height * containerAspect : this.width) | 0;
      const canvasHeight = (containerAspect > imageAspect ? this.height : this.width / containerAspect) | 0;

      if (this.canvas.width !== canvasWidth || this.canvas.height !== this.height) {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
      }
    } else {
      // cover
      const canvasWidth = (containerAspect > imageAspect ? this.width : this.height * containerAspect) | 0;
      const canvasHeight = (containerAspect > imageAspect ? this.width / containerAspect : this.height) | 0;

      if (this.canvas.width !== canvasWidth || this.canvas.height !== this.height) {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
      }
    }

    const dx = (this.canvas.width - this.width) * this.options.horizontalAlign;
    const dy = (this.canvas.height - this.height) * this.options.verticalAlign;

    if (this.clearCanvas || this.options.clearCanvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.clearCanvas = false;
    }
    this.context.drawImage(image, 0, 0, imageWidth, imageHeight, dx, dy, this.width, this.height);
  }

  private process() {
    for (const source of this.sources) {
      if (this.timeFrameVisible >= source.options.timeout / 1000) {
        source.process(() => this.setLoadingPriority());
      }
    }
  }

  private logDebugStatus(output: HTMLDivElement) {
    const formatPercentage = (n: number) => `${Math.abs(n * 100).toFixed(1).padStart(5, ' ')}%`;
    let debugInfo = `${this.options.name} - frames: ${this.frames.length}, loop: ${this.options.loop}, objectFit: ${this.options.objectFit}\n loadProgress ${formatPercentage(this.loadProgress)}, last frame drawn ${this.lastFrameDrawn}/${this.index}\n`;

    for (const source of this.sources) {
      const {progress, numLoading, numLoaded, maxLoaded} = source.getLoadStatus();
      debugInfo += ` src[${source.index}] ${source.type === INPUT_SRC ? `image:` : source.type === INPUT_CODE ? `code: ` : `tar:  `} ${formatPercentage(progress)}, numLoading: ${numLoading}, numLoaded: ${numLoaded}/${maxLoaded}${source.options.useWorker ? ', use worker' : ''}\n`;
    }
    logToScreen(output, debugInfo);
  }
}
