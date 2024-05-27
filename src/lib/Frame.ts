import type ImageElement from "./ImageElement.js";

export default class Frame {
  public index: number;
  public images: ImageElement[] = [];
  public priority: number = 0;

  constructor(index: number) {
    this.index = index;
  }

  public get image(): CanvasImageSource | undefined {
    return this.images.find(image => image.image !== undefined)?.image;
  }

  public async getImage(): Promise<CanvasImageSource> {
    return new Promise(async (resolve, reject) => {
      if (this.image !== undefined) {
        resolve(this.image);
      } else {
        const lastImage = this.images[this.images.length - 1];
        if (lastImage) {
          lastImage.fetchImage().then(img => resolve(img)).catch(() => reject());
        } else {
          reject();
        }
      }
    });
  }

  public async fetchImage(): Promise<CanvasImageSource | undefined> {
    return this.images.find(image => image.available)?.fetchImage();
  }

  public releaseImage() {
    this.images.forEach(image => image.releaseImage());
  }
}