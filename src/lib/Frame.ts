import type {FastImageSequence} from "./FastImageSequence.js";
import {getImageFetchWorker, releaseImageFetchWorker} from "./ImageFetchWorker.js";

export default class Frame {
  public index: number;
  public priority: number = 0;
  public tarImageAvailable: boolean = false;
  public loading: boolean = false;
  public loadingTarImage: boolean = false;

  private context: FastImageSequence;
  private _image: ImageBitmap | HTMLImageElement | undefined;
  private _tarImage: HTMLImageElement | ImageBitmap | undefined;

  constructor(context: FastImageSequence, index: number) {
    this.index = index;
    this.context = context;
  }

  public get tarImage(): HTMLImageElement | ImageBitmap | undefined {
    if (this._tarImage !== undefined && !this.loadingTarImage) {
      return this._tarImage;
    } else {
      return undefined;
    }
  }

  public set tarImage(image: HTMLImageElement | ImageBitmap | undefined) {
    this.releaseTarImage();
    this._tarImage = image;
  }

  public get image(): ImageBitmap | HTMLImageElement | undefined {
    if (this._image !== undefined && !this.loading) {
      return this._image;
    } else {
      return undefined;
    }
  }

  public set image(image: ImageBitmap | HTMLImageElement | undefined) {
    this.releaseImage();
    this._image = image;
  }

  get tarImageURL(): string | undefined {
    if (this.context.options.tarImageURLCallback) {
      return this.context.options.tarImageURLCallback(this.index);
    } else {
      return undefined;
    }
  }

  public get imageURL(): string | undefined {
    if (this.context.options.imageURLCallback) {
      return new URL(this.context.options.imageURLCallback(this.index), window.location.href).href;
    } else {
      return undefined;
    }
  }

  public reset() {
    this._image = undefined;
    this._tarImage = undefined;
    this.priority = 0;
  }

  public async getImage(): Promise<HTMLImageElement | ImageBitmap> {
    return new Promise(async (resolve, reject) => {
      if (this._image !== undefined) {
        resolve(this._image);
      } else if (this.tarImage !== undefined) {
        resolve(this.tarImage);
      } else {
        this.fetchTarImage().then(img => resolve(img)).catch(() => reject());
      }
    });
  }

  public async fetchImage() {
    return new Promise((resolve, reject) => {
      if (this.imageURL) {
        this.loading = true;

        const loadingDone = (image: ImageBitmap | HTMLImageElement) => {
          if (this.loading) {
            this.image = image;
            resolve(image);
          }
        };

        const loadingError = (e: any) => {
          this.reset();
          reject(e);
        };

        if (this.context.options.useWorkerForImage) {
          const worker = getImageFetchWorker();
          worker.load(this.index, this.imageURL).then((imageBitmap) => {
            loadingDone(imageBitmap);
            releaseImageFetchWorker(worker);
          }).catch(e => loadingError(e));
        } else {
          const imgElement = new Image();
          this.loadImage(imgElement, this.imageURL).then(() => {
            loadingDone(imgElement);
          }).catch(e => loadingError(e));
        }
      } else {
        reject();
      }
    });
  }

  public async fetchTarImage() {
    return new Promise<ImageBitmap | HTMLImageElement>((resolve, reject) => {
      if (this.tarImage !== undefined) {
        resolve(this.tarImage);
      } else if (this.tarImageAvailable && !this.loadingTarImage) {
        this.loadingTarImage = true;
        // @ts-ignore
        this.context.tarball.getImage(this.tarImageURL, this.index).then((image: HTMLImageElement | ImageBitmap) => {
          if (this.loadingTarImage) {
            this.tarImage = image;
            resolve(image);
          }
        }).catch(e => {
          this.loadingTarImage = false;
          this.reset();
          reject(e);
        });
      } else {
        this.reset();
        reject();
      }
    });
  }

  public releaseImage() {
    if (this._image) {
      if (this._image instanceof ImageBitmap) {
        this._image.close();
      }
      this._image = undefined;
    }
    this.loading = false;
  }

  public releaseTarImage() {
    if (this.tarImage) {
      if (this.tarImage instanceof ImageBitmap) {
        this.tarImage.close();
      }
      this._tarImage = undefined;
    }
    this.loadingTarImage = false;
  }

  private loadImage(img: HTMLImageElement, src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      img.onerror = (e) => reject(e);
      img.decoding = "async";
      img.src = src;
      img.decode().then(() => {
        resolve(img);
      }).catch(e => {
        console.error(e);
        reject(e);
        this.reset();
      });
    });
  }
}