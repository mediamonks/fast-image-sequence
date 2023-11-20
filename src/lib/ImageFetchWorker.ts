export class ImageFetchWorker {
    public index: number = -1e10;

    private worker: Worker;
    private resolve: ((bm: ImageBitmap) => void) | undefined;

    constructor() {
        const worker = new Worker(new URL("./ImageFetchWorker.worker.js", import.meta.url));

        worker.addEventListener('message', (e) => {
            if (this.resolve && e.data.index === this.index) {
                this.resolve(e.data.imageBitmap as ImageBitmap);
            } else {
                (e.data.imageBitmap as ImageBitmap).close();
            }
        });

        this.worker = worker;
    }

    public load(index: number, url: string): Promise<ImageBitmap> {
        this.index = index;
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.worker.postMessage({cmd: 'load', url, index});
        });
    }

    public abort() {
        this.index = -1e10;
        this.resolve = undefined;
    }
}
