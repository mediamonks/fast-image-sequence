import Tarball from "./Tarball.js";
import Frame from "./Frame.js";
import {ImageFetchWorker} from "./ImageFetchWorker.js";

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
 * @property {number} [numberOfCachedImages=32] - The number of images to cache.
 * @property {boolean} [clearCanvas=false] - Whether to clear the canvas before drawing.
 */
export type FastImageSequenceOptions = {
  frames: number,
  tarURL: string | undefined,
  imageURLCallback: ((index: number) => string) | undefined,
  tarImageURLCallback: ((index: number) => string) | undefined,
} & Partial<{
  wrap: boolean;
  fillStyle: string;
  size: 'contain' | 'cover';
  preloadAllTarImages: boolean;
  useWorkerForTar: boolean;
  numberOfCachedImages: number,
  clearCanvas: boolean,
}>

export default class FastImageSequence {
  public canvas: HTMLCanvasElement;
  public options: Required<FastImageSequenceOptions>;
  public width: number = 0;
  public height: number = 0;
  public frame: number = 0;
  public ready: Promise<void>;

  public tarball: Tarball | undefined;
  private context: CanvasRenderingContext2D;

  private static defaultOptions: Required<FastImageSequenceOptions> = {
    frames: 1,
    imageURLCallback: undefined,
    tarURL: undefined,
    tarImageURLCallback: undefined,
    wrap: false,
    fillStyle: '#00000000',
    size: 'cover',
    preloadAllTarImages: false,
    clearCanvas: false, // clear canvas before drawing
    useWorkerForTar: true, // more latency, but less computation on main thread
    numberOfCachedImages: 32,
  }
  private tickFuncs: ((dt: number) => void) [] = [];

  private frames: Frame[] = [];

  private startTime: number = -1;
  private animationRequestId: number = 0;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;
  private clearCanvas: boolean = true;

  private maxLoading: number = 6;

  private workerPool: ImageFetchWorker[] = [];
  private speed: number = 0;

  private prevFrame: number = 0;
  private direction: number = 1;
  private lastFrameDrawn: number = -1;

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
    this.canvas.style.width = `100%`;
    this.canvas.style.height = `100%`;

    this.container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => {
      this.clearCanvas = true;
    });
    this.resizeObserver.observe(container);

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
          await Promise.all(this.frames.map(frame => frame.fetchLowRes()));
        }
      }
      resolve();
    });
    this.drawingLoop(-1);
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

  /**
   * Get the image of a specific frame.
   * @param {number} index - The index of the frame.
   * @returns {Promise<HTMLImageElement | ImageBitmap>} - A promise that resolves with the image of the frame.
   */
  public getFrameImage(index: number): Promise<HTMLImageElement | ImageBitmap> {
    // @ts-ignore
    return this.frames[this.wrapIndex(index)].getImage();
  }

  public getWorker(): ImageFetchWorker {
    if (this.workerPool.length === 0) {
      this.workerPool.push(new ImageFetchWorker());
    }
    return this.workerPool.shift() as ImageFetchWorker;
  }

  public releaseWorker(worker: ImageFetchWorker) {
    worker.abort();
    this.workerPool.push(worker);
  }

  private get index(): number {
    return this.wrapIndex(this.frame);
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
    time /= 1000;

    const dt = this.startTime < 0 ? 1 / 60 : Math.min(time - this.startTime, 1 / 30);
    this.startTime = time > 0 ? time : -1;

    if (this.frame - this.prevFrame < 0) this.direction = -1;
    if (this.frame - this.prevFrame > 0) this.direction = 1;

    this.frame += this.speed * dt;
    this.frame = this.wrapFrame(this.frame);

    let index = this.index;

    // try to draw the bested cached image for this frame
    // let frameFound = false;
    // for (let i = 0; i < this.speed; i++) {
    //     const lookupIndex = this.wrapIndex(this.frame + this.direction * i);
    //     const frame = this.frames[lookupIndex] as Frame;
    //     if (frame.highRes !== undefined) {
    //         this.drawFrame(frame.highRes, lookupIndex);
    //         frameFound = true;
    //         break;
    //     }
    // }
    // if (!frameFound) {
    //     for (let i = 0; i < this.speed; i++) {
    //         const lookupIndex = this.wrapIndex(this.frame + this.direction * i);
    //         const frame = this.frames[lookupIndex] as Frame;
    //         if (frame.lowRes !== undefined) {
    //             this.drawFrame(frame.lowRes, lookupIndex);
    //             frameFound = true;
    //             break;
    //         }
    //     }
    // }

    const currentFrame = this.frames[index] as Frame;
    currentFrame.getImage().then((image) => {
      this.drawFrame(image, index);
    }).catch(() => {
    });


    this.load(dt);

    this.prevFrame = this.frame;

    this.tickFuncs.forEach(func => func(dt));

    this.animationRequestId = window.requestAnimationFrame(time => this.drawingLoop(time));
  }

  private drawFrame(image: HTMLImageElement | ImageBitmap, index: number) {
    if (Math.abs(this.lastFrameDrawn - this.index) < Math.abs(index - this.index)) {
      return;
    }
    this.lastFrameDrawn = index;

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

  private load(dt: number) {
    const index = this.index;
    const priorityIndex = this.index;// this.wrapIndex(Math.min(this.spread / 2 - 2, (this.frame - this.prevFrame) * (dt * 60)) + this.frame);

    this.frames.forEach((image) => {
      image.priority = Math.abs(image.index - priorityIndex);
      if (this.options.wrap) {
        image.priority = Math.min(image.priority, this.options.frames - image.priority);
      }
    });

    let numLoading = this.frames.filter(a => a.loading).length;
    const maxLoading = this.maxLoading;

    // console.clear();
    // console.log(`index: ${index}, priorityIndex: ${priorityIndex}, numLoading: ${numLoading}, maxLoading: ${maxLoading}, spread: ${this.spread}`);

    this.frames.filter(a => a.highRes !== undefined && !a.loading && a.priority > this.spread).forEach(a => {
      a.releaseHighRes();
      if (!this.options.preloadAllTarImages) {
        a.releaseLowRes();
      }
    });

    // this.frames.filter(a => a.priority <= this.spread).forEach(a => {
    //     a.fetchLowRes();
    // });

    const imagesToLoad = this.frames.filter(a => a.highRes === undefined && !a.loading && a.priority <= this.spread).sort((a, b) => a.priority - b.priority);

    while (numLoading < maxLoading && imagesToLoad.length > 0) {
      const image = imagesToLoad.shift() as Frame;
      const index = image.index;

      // image.fetchLowRes().catch(() => {
      // });

      if (image.imageURL !== undefined) {
        image.loading = true;
        const worker = this.getWorker();
        worker.load(index, image.imageURL).then((imageBitmap) => {
          image.releaseHighRes();
          image.highRes = imageBitmap;
          image.loading = false;
          this.releaseWorker(worker);
        });
      }

      numLoading++;
    }
  }

  private get spread(): number {
    return this.options.wrap ? Math.floor(this.options.numberOfCachedImages / 2) : this.options.numberOfCachedImages;
  }

  /**
   * Destruct the FastImageSequence instance.
   */
  public destruct() {
    cancelAnimationFrame(this.animationRequestId);

    this.resizeObserver.disconnect();
    this.container.removeChild(this.canvas);
    this.canvas.replaceWith(this.canvas.cloneNode(true));
  }
}
