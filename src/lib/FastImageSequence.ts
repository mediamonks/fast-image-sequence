import Tarball from "./Tarball.js";
import Frame from "./Frame.js";
import {createLogElement, log} from "./Log.js";

export function isMobile(): boolean {
  return (typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

/**
 * @typedef {Object} FastImageSequenceOptions
 * @property {number} frames - The number of frames in the sequence.
 * @property {string | undefined} tarURL - The URL of the tar file containing the images for the sequence.
 * @property {((index: number) => string) | undefined} imageURLCallback - A callback function that returns the URL of an image given its index.
 * @property {((index: number) => string) | undefined} tarImageURLCallback - A callback function that returns the URL of an image in the tar file given its index.
 * @property {boolean} [wrap=false] - Whether the sequence should wrap around to the beginning when it reaches the end.
 * @property {string} [fillStyle='#00000000'] - The fill style of the canvas.
 * @property {'contain' | 'cover'} [size='cover'] - How the image should be resized to fit the canvas.
 * @property {boolean} [preloadAllTarImages=false] - Whether all images from the tar file should be preloaded.
 * @property {boolean} [useWorkerForTar=true] - Whether to use a worker for handling the tar file.
 * @property {boolean} [useWorkerForImage=!isMobile()] - Whether to use a worker for fetching images.
 * @property {number} [numberOfCachedImages=32] - The number of images to cache.
 * @property {boolean} [clearCanvas=false] - Whether to clear the canvas before drawing.
 */
export type FastImageSequenceOptions = {
  frames: number,
} & Partial<{
  tarURL: string | undefined,
  imageURLCallback: ((index: number) => string) | undefined,
  tarImageURLCallback: ((index: number) => string) | undefined,
  wrap: boolean;
  fillStyle: string;
  size: 'contain' | 'cover';
  preloadAllTarImages: boolean;
  useWorkerForTar: boolean;
  useWorkerForImage: boolean;
  numberOfCachedImages: number,
  clearCanvas: boolean,
  showDebugInfo: boolean,
}>

export class FastImageSequence {
  private static defaultOptions: Required<FastImageSequenceOptions> = {
    frames:               1,
    imageURLCallback:     undefined,
    tarURL:               undefined,
    tarImageURLCallback:  undefined,
    wrap:                 false,
    fillStyle:            '#00000000',
    size:                 'cover',
    preloadAllTarImages:  false,
    clearCanvas:          false, // clear canvas before drawing
    useWorkerForTar:      true, // more latency, but less computation on main thread
    useWorkerForImage:    !isMobile(), // less latency and memory usage, but more computation on main thread
    numberOfCachedImages: 32,
    showDebugInfo:        false,
  };
  public canvas: HTMLCanvasElement;
  public options: Required<FastImageSequenceOptions>;
  public width: number = 0;
  public height: number = 0;
  public frame: number = 0;
  public ready: Promise<void>;
  public tarball: Tarball | undefined;
  private context: CanvasRenderingContext2D;
  private tickFuncs: ((dt: number) => void) [] = [];

  private frames: Frame[] = [];

  private startTime: number = -1;
  private animationRequestId: number = 0;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;
  private mutationOberver: MutationObserver;
  private clearCanvas: boolean = true;

  private maxLoading: number = 6;

  private speed: number = 0;
  private prevFrame: number = 0;
  private direction: number = 1;
  private lastFrameDrawn: number = -1;
  private destructed: boolean = false;
  private logElement: HTMLElement | undefined;

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
    // make sure the number of cached images is odd
    this.options.numberOfCachedImages = Math.floor(this.options.numberOfCachedImages / 2) * 2 + 1;
    this.options.numberOfCachedImages = Math.max(1, Math.min(this.options.numberOfCachedImages, this.options.frames));

    this.container = container;

    this.canvas = document.createElement('canvas');
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');
    this.context.fillStyle = this.options.fillStyle;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.style.width = `100%`;
    this.canvas.style.height = `100%`;

    this.container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => {
      this.clearCanvas = true;
    });
    this.resizeObserver.observe(this.canvas);

    this.mutationOberver = new MutationObserver(() => {
      if (!this.container.isConnected) {
        console.error('FastImageSequence: container is not connected to the DOM, fast image sequence will be destroyed');
        this.destruct();
      }
    });
    this.mutationOberver.observe(container, {childList: true});

    // init all frames
    for (let i = 0; i < this.options.frames; i++) {
      this.frames.push(new Frame(this, i));
    }

    // load tar file
    this.ready = new Promise(async (resolve, reject) => {
      if (this.options.tarURL !== undefined) {
        const response = await fetch(this.options.tarURL);
        const blob = await response.blob();
        const data = await blob.arrayBuffer();
        this.tarball = new Tarball(data, {useWorker: this.options.useWorkerForTar});

        this.frames.forEach(frame => frame.tarImageAvailable = frame.tarImageURL !== undefined && this.tarball?.getInfo(frame.tarImageURL) !== undefined);

        if (this.options.preloadAllTarImages) {
          await Promise.all(this.frames.map(frame => frame.fetchTarImage()));
        }
      }
      resolve();
    });
    this.drawingLoop(-1);

    if (this.options.showDebugInfo) {
      this.logElement = createLogElement();
      this.container.appendChild(this.logElement);
      this.tick(() => this.logDebugStatus(this.logElement as HTMLDivElement));
    }
  }

  public get isPlaying(): boolean {
    return this.speed !== 0;
  }

  public get isPaused(): boolean {
    return !this.isPlaying;
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

  private get index(): number {
    return this.wrapIndex(this.frame);
  }

  private get spread(): number {
    return this.options.wrap ? Math.floor(this.options.numberOfCachedImages / 2 + 1) : this.options.numberOfCachedImages;
  }

  /**
   * Register a tick function to be called on every frame update.
   *
   * @param tick - The function to be called.
   */
  public tick(func: (dt: number) => void) {
    this.tickFuncs.push(func);
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
   * @returns {Promise<HTMLImageElement | ImageBitmap>} - A promise that resolves with the image of the frame.
   */
  public getFrameImage(index: number): Promise<HTMLImageElement | ImageBitmap> {
    // @ts-ignore
    return this.frames[this.wrapIndex(index)].getImage();
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
    this.mutationOberver.disconnect();

    this.container.removeChild(this.canvas);
    if (this.logElement) {
      this.container.removeChild(this.logElement);
      this.logElement = undefined;
    }
    this.canvas.replaceWith(this.canvas.cloneNode(true));
    this.frames.forEach(frame => {
      frame.releaseImage();
      frame.releaseTarImage();
    });
  }

  private wrapIndex(frame: number) {
    const index = frame | 0;
    return this.wrapFrame(index);
  }

  private wrapFrame(index: number) {
    if (this.options.wrap) {
      return ((index % this.options.frames) + this.options.frames) % this.options.frames;
    } else {
      return Math.max(Math.min(index, this.options.frames - 1), 0);
    }
  }

  private async drawingLoop(time: number = 0) {
    if (this.destructed) {
      return;
    }

    time /= 1000;

    const dt = this.startTime < 0 ? 1 / 60 : Math.min(time - this.startTime, 1 / 30);
    this.startTime = time > 0 ? time : -1;

    if (this.frame - this.prevFrame < 0) this.direction = -1;
    if (this.frame - this.prevFrame > 0) this.direction = 1;

    this.frame += this.speed * dt;
    this.frame = this.wrapFrame(this.frame);

    const index = this.index;

    // check if canvas is in viewport
    const rect = this.canvas.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
      const currentFrame = this.frames[index] as Frame;
      currentFrame.getImage().then((image) => {
        // this.drawFrame(currentFrame);
      }).catch(() => {
      });

      // find the best matching loaded frame, based on current index and direction
      // first set some sort of priority
      this.frames.forEach((frame) => {
        frame.priority = Math.abs(frame.index - index);
        let direction = Math.sign(this.frame - this.prevFrame);
        if (this.options.wrap) {
          const wrappedPriority = this.options.frames - frame.priority;
          if (wrappedPriority < frame.priority) {
            frame.priority = wrappedPriority;
            // direction *= -1;
          }
        }
        // frame.priority += this.direction * direction === -1 ? this.frames.length : 0;
      });
      this.frames.sort((a, b) => b.priority - a.priority);
      //
      // best loaded image
      const bestImageMatch = this.frames.filter(a => a.image !== undefined).pop();
      if (bestImageMatch && bestImageMatch.image) {
        this.drawFrame(bestImageMatch);
      }
      // best loaded tar match
      const bestTarMatch = this.frames.filter(a => a.tarImage !== undefined).pop();
      if (bestTarMatch && bestTarMatch.tarImage) {
        if (!(bestImageMatch && bestImageMatch.image && bestImageMatch.priority <= bestTarMatch.priority)) {
          this.drawFrame(bestTarMatch);
        }
      }
    }

    this.process(dt);

    this.tickFuncs.forEach(func => func(dt));

    this.prevFrame = this.frame;
    this.animationRequestId = requestAnimationFrame(time => this.drawingLoop(time));
  }

  private drawFrame(frame: Frame) {
    const image = frame.image || frame.tarImage;
    if (!image) {
      return;
    }

    this.lastFrameDrawn = frame.index;

    const containerAspect = this.container.offsetWidth / this.container.offsetHeight;
    const imageAspect = image.width / image.height;

    this.width = Math.max(this.width, image.width);
    this.height = Math.max(this.height, image.height);

    if (this.options.size === 'contain') {
      // contain
      const canvasWidth = containerAspect > imageAspect ? this.height * containerAspect : this.width;
      const canvasHeight = containerAspect > imageAspect ? this.height : this.width / containerAspect;

      if (this.canvas.width !== canvasWidth || this.canvas.height !== this.height) {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
      }
    } else {
      // cover
      const canvasWidth = containerAspect > imageAspect ? this.width : this.height * containerAspect;
      const canvasHeight = containerAspect > imageAspect ? this.width / containerAspect : this.height;

      if (this.canvas.width !== canvasWidth || this.canvas.height !== this.height) {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
      }

    }

    const dx = (this.canvas.width - this.width) / 2;
    const dy = (this.canvas.height - this.height) / 2;

    if (this.clearCanvas || this.options.clearCanvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.clearCanvas = false;
    }
    this.context.drawImage(image, 0, 0, image.width, image.height, dx, dy, this.width, this.height);
  }

  private process(dt: number) {
    const index = this.index;
    const priorityIndex = this.index;// this.wrapIndex(Math.min(this.spread / 2 - 2, (this.frame - this.prevFrame) * (dt * 60)) + this.frame);

    // set priority for all images
    this.frames.forEach((image) => {
      image.priority = Math.abs(image.index - priorityIndex);
      if (this.options.wrap) {
        image.priority = Math.min(image.priority, this.options.frames - image.priority);
      }
    });

    // release tar images if needed
    if (!this.options.preloadAllTarImages) {
      let {numLoaded, numLoading} = this.getTarStatus();
      if (numLoaded > this.options.numberOfCachedImages - numLoading) {
        this.frames.filter(a => a.tarImage !== undefined && !a.loading && a.priority >= this.spread).forEach(a => {
          if (numLoaded > this.options.numberOfCachedImages - numLoading) {
            a.releaseTarImage();
            numLoaded--;
          }
        });
      }
    }

    // prioritize loading images and start loading images
    let numLoading = this.getLoadStatus().numLoading;
    const maxLoading = this.maxLoading;
    const imagesToLoad = this.frames.filter(a => a.image === undefined && !a.loading && a.priority < this.spread).sort((a, b) => a.priority - b.priority);

    while (numLoading < maxLoading && imagesToLoad.length > 0) {
      const image = imagesToLoad.shift() as Frame;

      image.fetchImage().then(() => {
        this.releaseImageWithLowestPriority();
      }).catch((e) => {
        console.error(e);
      });

      numLoading++;
    }
  }

  private getLoadStatus() {
    const used = this.options.imageURLCallback !== undefined;
    const numLoading = this.frames.filter(a => a.loading).length;
    const numLoaded = this.frames.filter(a => a.image !== undefined).length;
    const maxLoaded = this.options.numberOfCachedImages;
    const progress = (maxLoaded - numLoading) / maxLoaded;
    return {used, progress, numLoading, numLoaded, maxLoaded};
  }

  private getTarStatus() {
    const used = this.options.tarURL !== undefined;
    const tarLoaded = this.tarball !== undefined;
    const numLoading = this.frames.filter(a => a.loadingTarImage).length;
    const numLoaded = this.frames.filter(a => a.tarImage !== undefined).length;
    const maxLoaded = this.options.preloadAllTarImages ? this.frames.length : this.options.numberOfCachedImages;
    const progress = numLoaded / maxLoaded;
    return {used, tarLoaded, progress, numLoading, numLoaded, maxLoaded};
  }

  private logDebugStatus(output: HTMLDivElement) {
    let debugInfo = `FastImageSequence - frames: ${this.frames.length}, maxCache: ${this.options.numberOfCachedImages}, wrap: ${this.options.wrap} \n- last frame drawn ${this.lastFrameDrawn}/${this.index}\n`;
    const formatPercentage = (n: number) => `${Math.abs(n * 100).toFixed(1).padStart(5, ' ')}%`;
    {
      const {used, progress, numLoading, numLoaded, maxLoaded} = this.getLoadStatus();
      debugInfo += `- images: ${used ? `${formatPercentage(progress)}, numLoading: ${numLoading}, numLoaded: ${numLoaded}/${maxLoaded}` : 'not used'} \n`;
    }
    {
      const {used, tarLoaded, progress, numLoading, numLoaded, maxLoaded} = this.getTarStatus();
      debugInfo += `- tar:    ${used ? `${formatPercentage(progress)}, numLoading: ${numLoading}, numLoaded: ${numLoaded}/${maxLoaded}` : 'not used'}`;
    }
    log(output, debugInfo);
  }

  private releaseImageWithLowestPriority() {
    const loadedImages = this.frames.filter(a => a.image !== undefined && !a.loading);
    if (loadedImages.length > this.options.numberOfCachedImages) {
      const sortedFrame = loadedImages.sort((a, b) => a.priority - b.priority).pop();
      if (sortedFrame) {
        // console.log('release image for frame', sortedFrame.index);
        sortedFrame.releaseImage();
      }
    }
  }
}
