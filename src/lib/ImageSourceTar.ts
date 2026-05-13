import ImageSource, {INPUT_TAR} from "./ImageSource.js";
import {downloadFile} from "./DownloadFile.js";
import Tarball from "./Tarball.js";
import type ImageElement from "./ImageElement.js";

export default class ImageSourceTar extends ImageSource {
    public tarball: Tarball | undefined;

    public override get type() {
        return INPUT_TAR;
    }

    public override async loadResources() {
        if (this.options.tarURL !== undefined) {
            const data = await downloadFile(this.options.tarURL, (p) => this.downloadProgress = p);
            this.tarball = new Tarball(data, {useWorker: this.options.useWorker});
            this.context.log('Tarball', this.tarball);
        }
        return super.loadResources();
    }

    public override getImageURL(index: number): string | undefined {
        return this.options.imageURL ? this.options.imageURL(index) : undefined;
    }

    public override async fetchImage(imageElement: ImageElement): Promise<CanvasImageSource> {
        if (!imageElement.available) {
            throw new Error(`Tarball image not available: ${imageElement.imageURL}`);
        }
        return await this.tarball!.getImage(imageElement.imageURL || '', imageElement.frame.index);
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