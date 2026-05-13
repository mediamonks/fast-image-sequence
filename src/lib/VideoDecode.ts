import videoWorkerSource from './VideoDecode.worker.js?raw';

export type VideoInfo = {
    frames: number;
    width: number;
    height: number;
}

type WorkerMessage =
    | {cmd: 'ready', frames: number, width: number, height: number}
    | {cmd: 'frame', requestId: number, frame: VideoFrame}
    | {cmd: 'error', message: string, requestId?: number};

export default class VideoDecode {
    public info: VideoInfo | undefined;
    public ready: Promise<VideoInfo>;

    private worker: Worker;
    private nextRequestId: number = 0;
    private pending: Map<number, {resolve: (frame: VideoFrame) => void, reject: (reason?: unknown) => void}> = new Map();
    private readyResolve!: (info: VideoInfo) => void;
    private readyReject!: (reason?: unknown) => void;
    private destructed: boolean = false;

    constructor(buffer: ArrayBuffer) {
        if (typeof VideoDecoder === 'undefined') {
            throw new Error('WebCodecs VideoDecoder is not available in this browser');
        }

        const workerBlob = new Blob([videoWorkerSource], {type: 'application/javascript'});
        this.worker = new Worker(URL.createObjectURL(workerBlob));

        this.ready = new Promise<VideoInfo>((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });

        this.worker.addEventListener('message', (e) => this.onMessage(e.data));
        this.worker.addEventListener('error', (e) => {
            const message = e.message || 'Worker error';
            if (!this.info) this.readyReject(new Error(message));
            else console.error('VideoDecode worker error:', message);
        });
        this.worker.postMessage({cmd: 'init', buffer}, [buffer]);
    }

    public getFrame(index: number): Promise<VideoFrame> {
        if (this.destructed) return Promise.reject(new Error('VideoDecode destructed'));
        const requestId = this.nextRequestId++;
        return new Promise<VideoFrame>((resolve, reject) => {
            this.pending.set(requestId, {resolve, reject});
            this.worker.postMessage({cmd: 'decode', requestId, index});
        });
    }

    public destruct() {
        if (this.destructed) return;
        this.destructed = true;
        for (const {reject} of this.pending.values()) reject(new Error('VideoDecode destructed'));
        this.pending.clear();
        this.worker.postMessage({cmd: 'destroy'});
        this.worker.terminate();
    }

    private onMessage(msg: WorkerMessage) {
        if (msg.cmd === 'ready') {
            this.info = {frames: msg.frames, width: msg.width, height: msg.height};
            this.readyResolve(this.info);
        } else if (msg.cmd === 'frame') {
            const entry = this.pending.get(msg.requestId);
            if (entry) {
                this.pending.delete(msg.requestId);
                entry.resolve(msg.frame);
            } else {
                msg.frame.close();
            }
        } else if (msg.cmd === 'error') {
            if (msg.requestId !== undefined && this.pending.has(msg.requestId)) {
                this.pending.get(msg.requestId)!.reject(new Error(msg.message));
                this.pending.delete(msg.requestId);
            } else if (!this.info) {
                this.readyReject(new Error(msg.message));
            } else {
                // No requestId — a decoder-wide error. Reject every in-flight request
                // so the upper layer can recover instead of waiting forever.
                console.error('VideoDecode error:', msg.message);
                for (const {reject} of this.pending.values()) reject(new Error(msg.message));
                this.pending.clear();
            }
        }
    }
}
