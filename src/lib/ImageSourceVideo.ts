import type {FastImageSequence} from "./FastImageSequence.js";
import ImageSource, {type ImageSourceOptions, INPUT_VIDEO} from "./ImageSource.js";
import {downloadFile} from "./DownloadFile.js";
import VideoDecode from "./VideoDecode.js";
import type ImageElement from "./ImageElement.js";

export default class ImageSourceVideo extends ImageSource {
    public decoder: VideoDecode | undefined;
    private videoLoadProgress: number = 0;

    constructor(context: FastImageSequence, index: number, options: Partial<ImageSourceOptions>) {
        // WebCodecs decode is sequential and always runs in a worker — force these regardless of caller input.
        super(context, index, {...options, maxConnectionLimit: 1, useWorker: true});
    }

    public override get type() {
        return INPUT_VIDEO;
    }

    public override async loadResources() {
        if (this.options.videoURL !== undefined) {
            const data = await downloadFile(this.options.videoURL, (progress) => {
                this.videoLoadProgress = progress;
            });
            this.decoder = new VideoDecode(data);
            const info = await this.decoder.ready;
            if (this.context.options.frames !== info.frames) {
                this.context.log(`ImageSourceVideo: options.frames (${this.context.options.frames}) does not match video frame count (${info.frames})`);
            }
        }
        return super.loadResources();
    }

    public override getLoadStatus() {
        const status = super.getLoadStatus();
        status.progress = this.videoLoadProgress / 2 + status.progress / 2;
        return status;
    }

    public override async fetchImage(imageElement: ImageElement): Promise<CanvasImageSource> {
        if (!this.decoder) throw new Error('VideoDecode not initialized');
        return this.decoder.getFrame(imageElement.frame.index);
    }

    public override destruct() {
        super.destruct();
        this.decoder?.destruct();
        this.decoder = undefined;
    }

    protected override available(image: ImageElement, available: boolean = true): boolean {
        const info = this.decoder?.info;
        available = available && info !== undefined && image.frame.index < info.frames;
        return super.available(image, available);
    }
}
