import ImageSource, {type ImageSourceType, INPUT_SRC, INPUT_TAR} from "./ImageSource.js";
import {getImageFetchWorker, releaseImageFetchWorker} from "./ImageFetch.js";
import type Frame from "./Frame.js";


export default class ImageElement {
  public available: boolean = true;
  public loading: boolean = false;
  public type: ImageSourceType = INPUT_SRC;
  public frame: Frame;

  private _image: ImageBitmap | HTMLImageElement | undefined;
  private context: ImageSource;
  private index: number;

  constructor(context: ImageSource, frame: Frame, index: number) {
    this.context = context;
    this.frame = frame;
    this.index = index;
    this.type = this.context.type;
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

  public get imageURL(): string | undefined {
    if (this.type === INPUT_SRC) {
      return this.context.options.imageURL ? new URL(this.context.options.imageURL(this.index), window.location.href).href : undefined;
    } else if (this.type === INPUT_TAR) {
      return this.context.options.imageURL ? this.context.options.imageURL(this.index) : undefined;
    } else {
      return undefined;
    }
  }

  public reset() {
    this.releaseImage();
    this._image = undefined;
  }

  public async fetchImage(): Promise<ImageBitmap | HTMLImageElement> {
    if (this.type === INPUT_SRC) {
      return this.fetchImageSrc();
    } else {
      return this.fetchImageTar();
    }
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

  private async fetchImageSrc() {
    return new Promise<ImageBitmap | HTMLImageElement>((resolve, reject) => {
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

        if (this.context.options.useWorker) {
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

  private async fetchImageTar() {
    return new Promise<ImageBitmap | HTMLImageElement>((resolve, reject) => {
      if (this.image !== undefined) {
        resolve(this.image);
      } else if (this.available && !this.loading) {
        this.loading = true;
        this.context.tarball?.getImage(this.imageURL || '', this.index).then((image: HTMLImageElement | ImageBitmap) => {
          if (this.loading) {
            this.image = image;
            resolve(image);
          }
        }).catch(e => {
          this.loading = false;
          this.reset();
          reject(e);
        });
      } else {
        this.reset();
        reject();
      }
    });
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