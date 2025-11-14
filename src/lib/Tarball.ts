import tarballWorkerSource from './Tarball.worker.js?raw';

type TarballOptions = {
    useWorker: boolean;
}

type TarballFileInfo = {
    name: string;
    size: number;
    header_offset: number;
}

export default class Tarball {
    public fileInfo: TarballFileInfo[] = [];
    public buffer: ArrayBuffer;
    public options: TarballOptions;

    private worker: Worker | undefined;
    private resolve: (((bm: ImageBitmap) => void) | undefined)[] = [];

    private defaultOptions: TarballOptions = {
        useWorker: true,
    };

    constructor(buffer: ArrayBuffer, options: Partial<TarballOptions> = {}) {
        this.buffer = buffer;
        this.options = {...this.defaultOptions, ...options};

        let offset = 0;

        while (offset < this.buffer.byteLength - 512) {
            const name = this.readFileName(offset); // file name
            if (name.length == 0) {
                break;
            }
            const size = this.readFileSize(offset);

            this.fileInfo.push({
                name, size,
                header_offset: offset,
            });

            offset += (512 + 512 * Math.trunc(size / 512));
            if (size % 512) {
                offset += 512;
            }
        }
    }

    public getInfo(file_name: string) {
        return this.fileInfo.find(info => info.name.includes(file_name));
    }

    public getImage(file_name: string, index: number) {
        if (this.options.useWorker) {
            if (!this.worker) {
                this.worker = this.createWorker();
            }

            return new Promise<ImageBitmap>((resolve, reject) => {
                const info = this.getInfo(file_name);
                if (info && !this.resolve[index]) {
                    this.resolve[index] = resolve;
                    // @ts-ignore
                    this.worker.postMessage({cmd: 'load', offset: info.header_offset + 512, size: info.size, index});
                } else {
                    reject('Image already loading from tar');
                }
            });
        } else {
            return new Promise<HTMLImageElement | ImageBitmap>((resolve, reject) => {
                const blob = this.getBlob(file_name, 'image');
                if (blob !== undefined) {
                    // const img = new Image();
                    // img.onload = () => resolve(img);
                    // img.onerror = (e) => reject(e);
                    // img.src = URL.createObjectURL(blob);
                    createImageBitmap(blob).then((imageBitmap) => {
                        resolve(imageBitmap);
                    }).catch(() => {
                        reject();
                    });
                } else {
                    reject();
                }
            });
        }
    }

    public destruct() {
        if (this.worker) {
            this.worker.terminate();
        }
        this.resolve = [];
    }

    private readFileName(str_offset: number) {
        const strView = new Uint8Array(this.buffer, str_offset, 100);
        const i = strView.indexOf(0);
        const td = new TextDecoder();
        return td.decode(strView.slice(0, i));
    }

    private readFileSize(header_offset: number) {
        const szView = new Uint8Array(this.buffer, header_offset + 124, 12);
        let szStr = "";
        for (let i = 0; i < 11; i++) {
            szStr += String.fromCharCode(szView[i] as number);
        }
        return parseInt(szStr, 8);
    }


    // worker functionality

    private getBlob(file_name: string, mimetype: string = '') {
        const info = this.getInfo(file_name);
        if (info) {
            const view = new Uint8Array(this.buffer, info.header_offset + 512, info.size);
            return new Blob([view], {"type": mimetype});
        }
    }

    private createWorker() {
        const tarballWorkerBlob = new Blob([tarballWorkerSource], {type: 'application/javascript'});
        const worker = new Worker(URL.createObjectURL(tarballWorkerBlob));

        worker.addEventListener('message', (e) => {
            const fn = this.resolve[e.data.index];
            this.resolve[e.data.index] = undefined;
            if (fn) {
                fn(e.data.imageBitmap as ImageBitmap);
            } else {
                (e.data.imageBitmap as ImageBitmap).close();
            }
        });

        worker.postMessage({cmd: 'init', buffer: this.buffer}, [this.buffer]);

        return worker;
    }
}