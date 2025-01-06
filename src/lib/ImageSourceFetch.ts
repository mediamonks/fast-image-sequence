import ImageElement from "./ImageElement.js";
import {getImageFetchWorker, releaseImageFetchWorker} from "./ImageFetch.js";
import {loadImage} from "./DownloadFile.js";
import ImageSource, {INPUT_SRC} from "./ImageSource.js";

export default class ImageSourceFetch extends ImageSource {
  public override get type() {
    return INPUT_SRC;
  }

  public override getImageURL(index: number): string | undefined {
    return this.options.imageURL ? new URL(this.options.imageURL(index), window.location.href).href : undefined;
  }

  public override async fetchImage(imageElement: ImageElement) {
    return new Promise<CanvasImageSource>((resolve, reject) => {
      if (imageElement.imageURL) {
        if (this.options.useWorker) {
          const worker = getImageFetchWorker();
          worker.load(this.index, imageElement.imageURL).then((imageBitmap) => {
            resolve(imageBitmap);
            releaseImageFetchWorker(worker);
          }).catch(e => reject(e));
        } else {
          const img = new Image();
          loadImage(img, imageElement.imageURL).then(() => {
            resolve(img);
          }).catch(e => reject(e));
        }
      } else {
        reject('Image url not set or image allready loading');
      }
    });
  }
}