import type {FastImageSequence} from "./FastImageSequence.js";

export default class Frame {
  public index: number;
  public highRes: ImageBitmap | HTMLImageElement | undefined;
  public priority: number = 0;
  public tarImageAvailable: boolean = false;

  public loading: boolean = false;

  private context: FastImageSequence;

  private _lowRes: HTMLImageElement | ImageBitmap | undefined;
  private loadingLowRes: boolean = false;

  constructor(context: FastImageSequence, index: number) {
    this.index = index;
    this.context = context;
  }

  public get lowRes(): HTMLImageElement | ImageBitmap | undefined {
    if (this._lowRes !== undefined && !this.loadingLowRes) {
      return this._lowRes;
    } else {
      return undefined;
    }
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
    this.releaseHighRes();
    this.releaseLowRes();
    this.loading = false;
    this.priority = 0;
  }

  public async getImage(): Promise<HTMLImageElement | ImageBitmap> {
    return new Promise(async (resolve, reject) => {
      if (this.highRes !== undefined) {
        resolve(this.highRes);
      } else if (this.lowRes !== undefined) {
        resolve(this.lowRes);
      } else {
        this.fetchLowRes().then(img => resolve(img)).catch(() => reject());
      }
    });
  }

  public loadImage(img: HTMLImageElement, src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      img.onerror = (e) => reject(e);
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

  public async fetchLowRes() {
    return new Promise<ImageBitmap | HTMLImageElement>((resolve, reject) => {
      if (this.lowRes !== undefined) {
        resolve(this.lowRes);
      } else if (this.tarImageAvailable && !this.loadingLowRes) {
        this.loadingLowRes = true;
        // @ts-ignore
        this.context.tarball.getImage(this.tarImageURL, this.index).then((image: HTMLImageElement | ImageBitmap) => {
          this._lowRes = image;
          this.loadingLowRes = false;
          resolve(image);
        }).catch(e => {
          this.loadingLowRes = false;
          this.reset();
          reject(e);
        });
      } else {
        this.reset();
        reject();
      }
    });
  }

  public releaseHighRes() {
    if (this.highRes) {
      if (this.highRes instanceof ImageBitmap) {
        this.highRes.close();
      }
      this.highRes = undefined;
    }
  }

  public releaseLowRes() {
    if (this.lowRes) {
      if (this.lowRes instanceof ImageBitmap) {
        this.lowRes.close();
      }
      this._lowRes = undefined;
      this.loadingLowRes = false;
    }
  }
}