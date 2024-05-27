import ImageElement from "./ImageElement.js";
import {getImageFetchWorker, releaseImageFetchWorker} from "./ImageFetch.js";
import {loadImage} from "./DownloadFile.js";
import ImageSource from "./ImageSource.js";

export default class ImageSourceFetch extends ImageSource {
  public override getImageURL(index: number): string | undefined {
    return this.options.imageURL ? new URL(this.options.imageURL(index), window.location.href).href : undefined;
  }

  public override async fetchImage(imageElement: ImageElement) {
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
}