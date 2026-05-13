import type ImageElement from "./ImageElement.js";

export default class Frame {
    public index: number;
    public images: ImageElement[] = [];
    public priority: number = 0;
    public treePriority: number = 0;

    constructor(index: number) {
        this.index = index;
    }

    public get image(): CanvasImageSource | undefined {
        return this.images.find(image => image.image !== undefined)?.image;
    }

    public async getImage(): Promise<CanvasImageSource> {
        if (this.image !== undefined) return this.image;
        const lastImage = this.images[this.images.length - 1];
        if (!lastImage) throw new Error('Frame has no image sources');
        return lastImage.fetchImage();
    }

    public async fetchImage(): Promise<CanvasImageSource | undefined> {
        return this.images.find(image => image.available)?.fetchImage();
    }

    public releaseImage() {
        this.images.forEach(image => image.releaseImage());
    }

    public reset() {
        this.images.forEach(image => image.reset());
    }
}
