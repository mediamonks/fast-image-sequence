import {clamp, type FastImageSequence, isMobile} from "./FastImageSequence.js";
import ImageElement from "./ImageElement.js";
import {getImageFetchWorker, releaseImageFetchWorker} from "./ImageFetch.js";
import {loadImage} from "./DownloadFile.js";

export const INPUT_SRC = 0;
export const INPUT_TAR = 1;

export type ImageSourceType = typeof INPUT_SRC | typeof INPUT_TAR;

/**
 * @typedef ImageSourceOptions
 *
 * This type represents the options for the ImageSource class.
 *
 * @property {((index: number) => string) | undefined} imageURL - A callback function that returns the URL of an image given its index.
 * @property {string | undefined} tarURL - The URL of the tar file containing the images for the sequence.
 * @property {boolean} useWorker - Whether to use a worker for fetching images.
 * @property {number} maxCachedImages - The number of images to cache.
 * @property {number} maxConnectionLimit - The maximum number of images to load at once.
 */
export type ImageSourceOptions = {
  imageURL: ((index: number) => string) | undefined,
  tarURL: string | undefined,
  useWorker: boolean;
  maxCachedImages: number,
  maxConnectionLimit: number,
}

export default class ImageSource {
  private static defaultOptions: Required<ImageSourceOptions> = {
    tarURL:             undefined,
    imageURL:           undefined,
    useWorker:          !isMobile(),
    maxCachedImages:    32,
    maxConnectionLimit: 4,
  };

  public options: ImageSourceOptions;
  public index: number = -0;
  public type: ImageSourceType;
  public initialized: boolean = false;

  protected context: FastImageSequence;

  constructor(context: FastImageSequence, index: number, options: Partial<ImageSourceOptions>) {
    this.context = context;
    this.index = index;
    this.options = {...ImageSource.defaultOptions, ...options};
    this.type = this.options.tarURL !== undefined ? INPUT_TAR : INPUT_SRC;

    this.options.maxCachedImages = clamp(Math.floor(this.options.maxCachedImages), 1, this.context.options.frames);

    this.context.frames.forEach(frame => frame.images[index] = new ImageElement(this, frame));
  }

  protected get images(): ImageElement[] {
    return this.context.frames.map(frame => frame.images[this.index] as ImageElement);
  }

  /**
   * Set the maximum number of images to cache.
   * @param maxCache - The maximum number of images to cache.
   * @param onProgress - A callback function that is called with the progress of the loading.
   */
  public setMaxCachedImages(maxCache: number, onProgress?: (progress: number) => void): Promise<boolean> {
    const max = this.initialized ? this.images.filter(a => a.available).length : this.context.options.frames;
    this.options.maxCachedImages = clamp(maxCache, 1, max);
    return this.context.onLoadProgress(onProgress);
  }

  public getImageURL(index: number): string | undefined {
    return this.options.imageURL ? new URL(this.options.imageURL(index), window.location.href).href : undefined;
  }

  public async loadResources() {
    if (!this.images[0]?.available) {
      throw new Error(`No image available for index 0 in ImageSource${this.index} (${this.images[0]?.imageURL})`);
    }

    this.initialized = true;
  }

  public process() {
    let {numLoading, numLoaded} = this.getLoadStatus();
    const maxConnectionLimit = this.options.maxConnectionLimit;
    const imagesToLoad = this.images.filter(a => a.image === undefined && !a.loading && a.frame.priority).sort((a, b) => a.frame.priority - b.frame.priority);
    const loadedImages = this.images.filter(a => a.image !== undefined && !a.loading).sort((a, b) => b.frame.priority - a.frame.priority);
    const maxLoadedPriority = loadedImages.shift()?.frame.priority ?? 1e10;

    while (numLoading < maxConnectionLimit && imagesToLoad.length > 0) {
      const image = imagesToLoad.shift() as ImageElement;
      if (image.frame.priority < maxLoadedPriority || numLoaded < this.options.maxCachedImages - numLoading) {
        image.fetchImage().then(() => {
          this.releaseImageWithLowestPriority();
        }).catch((e) => {
          console.error(e);
        });
      }
      numLoading++;
    }
  }

  public getLoadStatus() {
    const numLoading = this.images.filter(a => a.loading).length;
    const numLoaded = this.images.filter(a => a.image !== undefined).length;
    const maxLoaded = this.options.maxCachedImages;
    const progress = Math.max(0, numLoaded - numLoading) / Math.max(1, maxLoaded);
    return {progress, numLoading, numLoaded, maxLoaded};
  }

  public async fetchImage(imageElement: ImageElement) {
    return new Promise<ImageBitmap | HTMLImageElement>((resolve, reject) => {
      if (imageElement.imageURL) {
        imageElement.loading = true;

        const loadingDone = (image: ImageBitmap | HTMLImageElement) => {
          if (imageElement.loading) {
            imageElement.image = image;
            resolve(image);
          }
        };

        const loadingError = (e: any) => {
          imageElement.reset();
          reject(e);
        };

        if (this.options.useWorker) {
          const worker = getImageFetchWorker();
          worker.load(this.index, imageElement.imageURL).then((imageBitmap) => {
            loadingDone(imageBitmap);
            releaseImageFetchWorker(worker);
          }).catch(e => loadingError(e));
        } else {
          const imgElement = new Image();
          loadImage(imgElement, imageElement.imageURL).then(() => {
            loadingDone(imgElement);
          }).catch(e => loadingError(e));
        }
      } else {
        reject('Image url not set');
      }
    });
  }

  private releaseImageWithLowestPriority() {
    this.context.setLoadingPriority();
    const loadedImages = this.images.filter(a => a.image !== undefined && !a.loading);
    if (loadedImages.length > this.options.maxCachedImages) {
      const sortedFrame = loadedImages.sort((a, b) => a.frame.priority - b.frame.priority).pop();
      if (sortedFrame) {
        // console.log('release image for frame', sortedFrame.index);
        sortedFrame.releaseImage();
      }
    }
  }

  public destruct() {
    this.images.forEach(image => image.reset());
  }
}