import ImageSource from "./ImageSource.js";
import {downloadFile} from "./DownloadFile.js";
import Tarball from "./Tarball.js";
import type ImageElement from "./ImageElement.js";

export default class ImageSourceTar extends ImageSource {
  public tarball: Tarball | undefined;
  private tarLoadProgress: number = 0;

  public override async loadResources() {
    if (this.options.tarURL !== undefined) {
      const data = await downloadFile(this.options.tarURL, (progress) => {
        this.tarLoadProgress = progress;
      });
      this.tarball = new Tarball(data, {useWorker: this.options.useWorker});

      this.context.log('Tarball', this.tarball);

      this.images.forEach(image => image.available = image.imageURL !== undefined && this.tarball?.getInfo(image.imageURL) !== undefined);
    }

    return super.loadResources();
  }

  public override getImageURL(index: number): string | undefined {
    return this.options.imageURL ? this.options.imageURL(index) : undefined;
  }

  public override getLoadStatus() {
    const status = super.getLoadStatus();
    status.progress = this.tarLoadProgress / 2 + status.progress / 2;
    return status;
  }

  public override async fetchImage(imageElement: ImageElement) {
    return new Promise<ImageBitmap | HTMLImageElement>((resolve, reject) => {
      if (imageElement.image !== undefined) {
        resolve(imageElement.image);
      } else if (imageElement.available && !imageElement.loading) {
        imageElement.loading = true;
        this.tarball?.getImage(imageElement.imageURL || '', imageElement.frame.index).then((image: HTMLImageElement | ImageBitmap) => {
          imageElement.image = image;
          resolve(image);
        }).catch(e => {
          imageElement.reset();
          reject(e);
        });
      } else {
        reject(`Image not available or already loading ${imageElement.imageURL} ${imageElement.loading}`);
      }
    });
  }

  public override destruct() {
    super.destruct();
    this.tarball?.destruct();
    this.tarball = undefined;
  }

  protected override available(image: ImageElement, available: boolean = true): boolean {
    available = available && image.imageURL !== undefined && this.tarball?.getInfo(image.imageURL) !== undefined;
    return super.available(image, available);
  }
}