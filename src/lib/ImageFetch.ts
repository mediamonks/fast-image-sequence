import imageWorkerSource from './ImageFetch.worker.js?raw';

export class ImageFetch {
  public index: number = -1e10;

  private worker: Worker;
  private resolve: ((bm: ImageBitmap) => void) | undefined;

  constructor() {
    const workerBlob = new Blob([imageWorkerSource], {type: 'application/javascript'});
    const worker = new Worker(URL.createObjectURL(workerBlob));

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

// pool of workers

const workerPool: ImageFetch[] = [];

export function getImageFetchWorker(): ImageFetch {
  if (workerPool.length === 0) {
    workerPool.push(new ImageFetch());
  }
  return workerPool.shift() as ImageFetch;
}

export function releaseImageFetchWorker(worker: ImageFetch) {
  worker.abort();
  workerPool.push(worker);
}
