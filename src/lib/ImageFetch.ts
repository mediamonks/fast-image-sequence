import imageWorkerSource from './ImageFetch.worker.js?raw';
import {createWorkerFromSource} from './DownloadFile.js';
import {closeCanvasImage} from './ImageElement.js';

export class ImageFetch {
    private index: number = -1;
    private worker: Worker;
    private resolve: ((bm: ImageBitmap) => void) | undefined;
    private reject: ((reason?: unknown) => void) | undefined;

    constructor() {
        this.worker = createWorkerFromSource(imageWorkerSource);

        this.worker.addEventListener('message', (e) => {
            if (e.data.index !== this.index) {
                if (e.data.imageBitmap) closeCanvasImage(e.data.imageBitmap);
                return;
            }
            if (e.data.msg === 'error') {
                this.reject?.(new Error(e.data.message));
            } else if (this.resolve) {
                this.resolve(e.data.imageBitmap);
            } else {
                closeCanvasImage(e.data.imageBitmap);
            }
        });
    }

    public load(index: number, url: string): Promise<ImageBitmap> {
        this.index = index;
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.worker.postMessage({cmd: 'load', url, index});
        });
    }

    public abort() {
        this.index = -1;
        this.resolve = undefined;
        this.reject = undefined;
    }
}

const workerPool: ImageFetch[] = [];

export function getImageFetchWorker(): ImageFetch {
    if (workerPool.length === 0) workerPool.push(new ImageFetch());
    return workerPool.shift() as ImageFetch;
}

export function releaseImageFetchWorker(worker: ImageFetch) {
    worker.abort();
    workerPool.push(worker);
}
