import tarballWorkerSource from './Tarball.worker.js?raw';
import {createWorkerFromSource} from './DownloadFile.js';
import {closeCanvasImage} from './ImageElement.js';

type TarballOptions = {
    useWorker: boolean;
}

type TarballFileInfo = {
    name: string;
    size: number;
    header_offset: number;
}

export default class Tarball {
    private readonly fileInfo: TarballFileInfo[] = [];
    private buffer: ArrayBuffer | undefined;
    private readonly options: TarballOptions;

    private worker: Worker | undefined;
    private pending: Map<number, {resolve: (bm: ImageBitmap) => void, reject: (reason?: unknown) => void}> = new Map();

    private defaultOptions: TarballOptions = {
        useWorker: true,
    };

    constructor(buffer: ArrayBuffer, options: Partial<TarballOptions> = {}) {
        this.buffer = buffer;
        this.options = {...this.defaultOptions, ...options};

        let offset = 0;
        while (offset < buffer.byteLength - 512) {
            const name = this.readFileName(offset);
            if (name.length == 0) break;
            const size = this.readFileSize(offset);
            this.fileInfo.push({name, size, header_offset: offset});
            offset += 512 + 512 * Math.trunc(size / 512);
            if (size % 512) offset += 512;
        }
    }

    // Matches the exact entry name OR an entry whose path ends with "/<name>" — so
    // a tar made from a subdirectory (entries like "subdir/image1.jpg" or "./image1.jpg")
    // still resolves a caller's "image1.jpg". The "/" guard prevents "image1.jpg" from
    // spuriously matching "image11.jpg".
    public getInfo(file_name: string): TarballFileInfo | undefined {
        return this.fileInfo.find(info => info.name === file_name || info.name.endsWith('/' + file_name));
    }

    public getImage(file_name: string, index: number): Promise<ImageBitmap> {
        return new Promise<ImageBitmap>((resolve, reject) => {
            const info = this.getInfo(file_name);
            if (!info) {
                reject(new Error(`Tarball: file not found "${file_name}"`));
                return;
            }
            if (this.pending.has(index)) {
                reject(new Error('Image already loading from tar'));
                return;
            }
            if (this.options.useWorker) {
                if (!this.worker) this.worker = this.createWorker();
                this.pending.set(index, {resolve, reject});
                this.worker.postMessage({cmd: 'load', offset: info.header_offset + 512, size: info.size, index});
            } else if (this.buffer) {
                const view = new Uint8Array(this.buffer, info.header_offset + 512, info.size);
                createImageBitmap(new Blob([view], {type: 'image'})).then(resolve).catch(reject);
            } else {
                reject(new Error('Tarball: buffer already released'));
            }
        });
    }

    public destruct() {
        if (this.worker) this.worker.terminate();
        this.worker = undefined;
        this.pending.clear();
        this.buffer = undefined;
    }

    private readFileName(offset: number): string {
        const view = new Uint8Array(this.buffer!, offset, 100);
        const end = view.indexOf(0);
        return new TextDecoder().decode(view.slice(0, end));
    }

    private readFileSize(offset: number): number {
        const view = new Uint8Array(this.buffer!, offset + 124, 12);
        let str = '';
        for (let i = 0; i < 11; i++) str += String.fromCharCode(view[i] as number);
        return parseInt(str, 8);
    }

    private createWorker(): Worker {
        const worker = createWorkerFromSource(tarballWorkerSource);

        worker.addEventListener('message', (e) => {
            const entry = this.pending.get(e.data.index);
            this.pending.delete(e.data.index);
            if (e.data.msg === 'error') {
                if (entry) entry.reject(new Error(e.data.message));
                return;
            }
            if (entry) entry.resolve(e.data.imageBitmap);
            else closeCanvasImage(e.data.imageBitmap);
        });

        worker.postMessage({cmd: 'init', buffer: this.buffer}, [this.buffer!]);
        return worker;
    }
}
