import Tarball from "./Tarball.js";
import Frame from "./Frame.js";
import {createLogElement, logToScreen} from "./LogToScreen.js";
import {downloadFile} from "./DownloadFile.js";

export function isMobile(): boolean {
  return (typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type FastImageSequenceDisplayOptions = {
  objectFit: 'contain' | 'cover';
  horizontalAlign: number;
  verticalAlign: number;
}

/**
 * @typedef {Object} FastImageSequenceOptions
 * @property {number} frames - The number of frames in the sequence.
 * @property {((index: number) => string) | undefined} imageURLCallback - A callback function that returns the URL of an image given its index.
 * @property {string | undefined} tarURL - The URL of the tar file containing the images for the sequence.
 * @property {((index: number) => string) | undefined} tarImageURLCallback - A callback function that returns the URL of an image in the tar file given its index.
 * @property {boolean} [loop=false] - Whether the sequence should wrap around to the beginning when it reaches the end.
 * @property {string} [fillStyle='#00000000'] - The fill style of the canvas.
 * @property {'contain' | 'cover'} [objectFit='cover'] - How the image should be resized to fit the canvas.
 * @property {number} [horizontalAlign=0.5] - The horizontal alignment of the image.
 * @property {number} [verticalAlign=0.5] - The vertical alignment of the image.
 * @property {boolean} [preloadAllTarImages=false] - Whether all images from the tar file should be preloaded.
 * @property {boolean} [useWorkerForTar=true] - Whether to use a worker for handling the tar file.
 * @property {boolean} [useWorkerForImage=!isMobile()] - Whether to use a worker for fetching images.
 * @property {number} [maxCachedImages=32] - The number of images to cache.
 * @property {boolean} [clearCanvas=false] - Whether to clear the canvas before drawing.
 * @property {boolean} [showDebugInfo=false] - Whether to show debug info.
 * @property {string} [name='FastImageSequence'] - The name of the FastImageSequence instance.
 * @property {number} [maxConnectionLimit=4] - The maximum number of concurrent connections for fetching images.
 */
export type FastImageSequenceOptions = {
  frames: number,
} & Partial<{
  tarURL: string | undefined,
  imageURLCallback: ((index: number) => string) | undefined,
  tarImageURLCallback: ((index: number) => string) | undefined,
  loop: boolean;
  fillStyle: string;
  preloadAllTarImages: boolean;
  useWorkerForTar: boolean;
  useWorkerForImage: boolean;
  maxCachedImages: number,
  clearCanvas: boolean,
  showDebugInfo: boolean,
  name: string,
  maxConnectionLimit: number,
}> & Partial<FastImageSequenceDisplayOptions>;

export class FastImageSequence {
  private static defaultOptions: Required<FastImageSequenceOptions> = {
    frames:               1,
    imageURLCallback:     undefined,
    tarURL:               undefined,
    tarImageURLCallback:  undefined,
    loop:                 false,
    fillStyle:            '#00000000',
    objectFit:            'cover',
    preloadAllTarImages:  false,
    clearCanvas:          false, // clear canvas before drawing
    useWorkerForTar:      true, // more latency, but less computation on main thread
    useWorkerForImage:    !isMobile(), // less latency and memory usage, but more computation on main thread
    maxCachedImages: 32,
    showDebugInfo:        false,
    name:                 'FastImageSequence',
    maxConnectionLimit:   4,
    horizontalAlign:      0.5,
    verticalAlign:        0.5,
  };
  public canvas: HTMLCanvasElement;
  public options: Required<FastImageSequenceOptions>;
  public width: number = 0;
  public height: number = 0;
  public frame: number = 0;
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

  private speed: number = 0;
  private prevFrame: number = 0;
  private direction: number = 1;
  private lastFrameDrawn: number = -1;
  private destructed: boolean = false;
  private logElement: HTMLElement | undefined;
  private initialized: boolean = false;
  private log: (...args: any[]) => void;
  private tarLoadProgress: number = 0;

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
    this.options.maxCachedImages = Math.floor(this.options.maxCachedImages);
    this.options.maxCachedImages = clamp(this.options.frames, 1, this.options.maxCachedImages);

    this.container = container;

    this.canvas = document.createElement('canvas');
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');
    this.context.fillStyle = this.options.fillStyle;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    Object.assign(this.canvas.style, {
      inset: '0',
      width: '100%',
      height: '100%',
      margin: '0',
      display: 'block'
    });

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
    this.log = this.options.showDebugInfo ? console.log : () => {
    };

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
    const {used, numLoaded, numLoading, maxLoaded} = this.getLoadStatus();
    const {used: usedTar, numLoading: numLoadingTar, numLoaded: numLoadedTar, maxLoaded: maxLoadedTar, tarLoadProgress} = this.getTarStatus();
    return ((used ? Math.max(numLoaded - numLoading, 0) : 0) + (usedTar ? (Math.max(numLoadedTar - numLoadingTar, 0) / 2 + tarLoadProgress) : 0)) / ((used ? maxLoaded : 0) + (usedTar ? (maxLoadedTar / 2 + 1) : 0));
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
   * Get a promise that resolves when the image sequence is ready to play.
   */
  public get ready(): Promise<void> {
    // check if the sequence is initialized
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.lastFrameDrawn !== -1) {
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
  public async getFrameImage(index: number): Promise<HTMLImageElement | ImageBitmap> {
    const frame = this.frames[this.wrapIndex(index)] as Frame;
    try {
        return await frame.fetchImage();
    } catch {
        return await frame.fetchTarImage();
    }
  }

  /**
   * Set the maximum number of images to cache.
   * @param maxCache - The maximum number of images to cache.
   * @param onProgress - A callback function that is called with the progress of the loading.
   */
  public setMaxCachedImages(maxCache: number, onProgress?: (progress: number) => void): Promise<boolean> {
    this.options.maxCachedImages = clamp(maxCache, 1, this.options.frames);
    let loadProgress = this.loadProgress;
    return new Promise((resolve) => {
      const checkProgress = () => {
        if (this.loadProgress >= 1) {
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

  private get index(): number {
    return this.wrapIndex(this.frame);
  }

  private get spread(): number {
    return this.options.loop ? Math.floor(this.options.maxCachedImages / 2) : this.options.maxCachedImages;
  }

  private async loadResources() {
    if (this.options.tarURL !== undefined) {
      // const response = await fetch(this.options.tarURL);
      // const blob = await response.blob();
      // const data = await blob.arrayBuffer();
      const data = await downloadFile(this.options.tarURL, (progress) => {
        this.tarLoadProgress = progress;
      });
      this.tarball = new Tarball(data, {useWorker: this.options.useWorkerForTar});

      this.log('Tarball', this.tarball);

      this.frames.forEach(frame => frame.tarImageAvailable = frame.tarImageURL !== undefined && this.tarball?.getInfo(frame.tarImageURL) !== undefined);

      if (this.options.preloadAllTarImages) {
        await Promise.all(this.frames.map(frame => frame.fetchTarImage()));
      }
    }
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

    const index = this.index;

    // check if canvas is in viewport
    const rect = this.canvas.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
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

    if (this.options.objectFit === 'contain') {
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

    const dx = (this.canvas.width - this.width) * this.options.horizontalAlign;
    const dy = (this.canvas.height - this.height) * this.options.verticalAlign;

    if (this.clearCanvas || this.options.clearCanvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.clearCanvas = false;
    }
    this.context.drawImage(image, 0, 0, image.width, image.height, dx, dy, this.width, this.height);
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

  private process(dt: number) {
    this.setLoadingPriority();

    // release tar images if needed
    if (!this.options.preloadAllTarImages && this.options.tarURL !== undefined && this.tarball) {
      let {numLoading, numLoaded} = this.getTarStatus();
      const maxConnectionLimit = this.options.maxConnectionLimit;
      const imagesToLoad = this.frames.filter(a => a.tarImage === undefined && a.tarImageAvailable && !a.loadingTarImage).sort((a, b) => a.priority - b.priority);
      const loadedImages = this.frames.filter(a => a.tarImage !== undefined && a.tarImageAvailable && !a.loadingTarImage).sort((a, b) => b.priority - a.priority);
      const maxLoadedPriority = loadedImages.shift()?.priority ?? 1e10;

      while (numLoading < maxConnectionLimit && imagesToLoad.length > 0) {
        const image = imagesToLoad.shift() as Frame;

        if (image.priority < maxLoadedPriority || numLoaded < this.options.maxCachedImages - numLoading) {
          image.fetchTarImage().then(() => {
            this.releaseTarImageWithLowestPriority();
          }).catch((e) => {
            console.error(e);
          });
        }

        numLoading++;
      }
    }

    // prioritize loading images and start loading images
    if (this.options.imageURLCallback) {
      let {numLoading, numLoaded} = this.getLoadStatus();
      const maxConnectionLimit = this.options.maxConnectionLimit;
      const imagesToLoad = this.frames.filter(a => a.image === undefined && !a.loading && a.priority).sort((a, b) => a.priority - b.priority);
      const loadedImages = this.frames.filter(a => a.image !== undefined && !a.loading).sort((a, b) => b.priority - a.priority);
      const maxLoadedPriority = loadedImages.shift()?.priority ?? 1e10;

      while (numLoading < maxConnectionLimit && imagesToLoad.length > 0) {
        const image = imagesToLoad.shift() as Frame;
        if (image.priority < maxLoadedPriority || numLoaded < this.options.maxCachedImages - numLoading) {
          image.fetchImage().then(() => {
            this.releaseImageWithLowestPriority();
          }).catch((e) => {
            console.error(e);
          });
        }

        numLoading++;
      }
    }
  }

  private getLoadStatus() {
    const used = this.options.imageURLCallback !== undefined;
    const numLoading = this.frames.filter(a => a.loading).length;
    const numLoaded = this.frames.filter(a => a.image !== undefined).length;
    const maxLoaded = this.options.maxCachedImages;
    const progress = Math.max(0, numLoaded - numLoading) / maxLoaded;
    return {used, progress, numLoading, numLoaded, maxLoaded};
  }

  private getTarStatus() {
    const used = this.options.tarURL !== undefined;
    const tarLoaded = this.tarball !== undefined && this.initialized;
    const numLoading = this.frames.filter(a => a.loadingTarImage).length;
    const numLoaded = this.frames.filter(a => a.tarImage !== undefined).length;
    const maxLoaded = this.options.preloadAllTarImages ? this.frames.length : this.options.maxCachedImages;
    const tarLoadProgress = this.tarLoadProgress;
    const progress = numLoaded / maxLoaded;
    return {used, tarLoaded, progress, numLoading, numLoaded, maxLoaded, tarLoadProgress};
  }

  private logDebugStatus(output: HTMLDivElement) {
    const formatPercentage = (n: number) => `${Math.abs(n * 100).toFixed(1).padStart(5, ' ')}%`;
    let debugInfo = `${this.options.name} - frames: ${this.frames.length}, maxCache: ${this.options.maxCachedImages}, wrap: ${this.options.loop}, size: ${this.options.objectFit}\n- loadProgress ${formatPercentage(this.loadProgress)}, last frame drawn ${this.lastFrameDrawn}/${this.index}\n`;
    {
      const {used, progress, numLoading, numLoaded, maxLoaded} = this.getLoadStatus();
      debugInfo += `- images: ${used ? `${formatPercentage(progress)}, numLoading: ${numLoading}, numLoaded: ${numLoaded}/${maxLoaded}` : 'not used'} \n`;
    }
    {
      const {used, tarLoaded, progress, numLoading, numLoaded, maxLoaded} = this.getTarStatus();
      debugInfo += `- tar:    ${used ? `${formatPercentage(progress)}, numLoading: ${numLoading}, numLoaded: ${numLoaded}/${maxLoaded}` : 'not used'}`;
    }

    logToScreen(output, debugInfo);
  }

  private releaseImageWithLowestPriority() {
    this.setLoadingPriority();
    const loadedImages = this.frames.filter(a => a.image !== undefined && !a.loading);
    if (loadedImages.length > this.options.maxCachedImages) {
      const sortedFrame = loadedImages.sort((a, b) => a.priority - b.priority).pop();
      if (sortedFrame) {
        // console.log('release image for frame', sortedFrame.index);
        sortedFrame.releaseImage();
      }
    }
  }

  private releaseTarImageWithLowestPriority() {
    if (!this.options.preloadAllTarImages) {
      this.setLoadingPriority();
      const loadedImages = this.frames.filter(a => a.tarImage !== undefined && !a.loadingTarImage);
      if (loadedImages.length > this.options.maxCachedImages) {
        const sortedFrame = loadedImages.sort((a, b) => a.priority - b.priority).pop();
        if (sortedFrame) {
          // console.log('release tar image for frame', sortedFrame.index);
          sortedFrame.releaseTarImage();
        }
      }
    }
  }
}
