import ImageSource, {type ImageSourceType, INPUT_SRC} from "./ImageSource.js";
import type Frame from "./Frame.js";

export default class ImageElement {
  public available: boolean = true;
  public loading: boolean = false;
  public type: ImageSourceType = INPUT_SRC;
  public frame: Frame;

  private _image: CanvasImageSource | undefined;
  private context: ImageSource;

  constructor(context: ImageSource, frame: Frame) {
    this.context = context;
    this.frame = frame;
    this.type = this.context.type;
  }

  public get image(): CanvasImageSource | undefined {
    if (this._image !== undefined && !this.loading) {
      return this._image;
    } else {
      return undefined;
    }
  }

  public set image(image: CanvasImageSource | undefined) {
    if (image !== this._image) {
      this.releaseImage();
      this._image = image;
    }
  }

  public get imageURL(): string | undefined {
    return this.context.getImageURL(this.frame.index);
  }

  public reset() {
    this.releaseImage();
    this._image = undefined;
  }

  public async fetchImage(): Promise<CanvasImageSource> {
    return this.context.fetchImage(this);
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
}