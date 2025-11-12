import {clamp, type FastImageSequence, isMobile} from "./FastImageSequence.js";
import ImageElement from "./ImageElement.js";

export const INPUT_SRC = 0;
export const INPUT_TAR = 1;
export const INPUT_CODE = 2;

export type ImageSourceType = typeof INPUT_SRC | typeof INPUT_TAR | typeof INPUT_CODE;

/**
 * @typedef ImageSourceOptions
 *
 * This type represents the options for the ImageSource class.
 *
 * @property {((index: number) => string) | undefined} imageURL - A callback function that returns the URL of an image given its index.
 * @property {string | undefined} tarURL - The URL of the tar file containing the images for the sequence.
 * @property {boolean} useWorker - Whether to use a worker for fetching images.
 * @property {number} maxCachedImages - The number of images to cache.
 * @property {number} maxConnectionLimit - The maximum number of images to load simultaneously.
 * @property {number} hierarchicalCacheFraction - Fraction of cache reserved for hierarchical preloading, enabling responsive scrubbing through the entire sequence.
 * @property {((index: number) => boolean) | undefined} available - A callback function that returns if an image is available given its index.
 * @property {((index: number) => Promise<CanvasImageSource>) | undefined} image - A callback function that returns the image element given its index.
 * @property {number} timeout - Only start loading an image if the same frame is visible for this time (in milliseconds).
 */
export type ImageSourceOptions = {
    imageURL: ((index: number) => string) | undefined,
    tarURL: string | undefined,
    useWorker: boolean;
    maxCachedImages: number,
    maxConnectionLimit: number,
    hierarchicalCacheFraction: number,
    available: ((index: number) => boolean) | undefined,
    image: ((index: number) => Promise<CanvasImageSource>) | undefined,
    timeout: number,
}

export default class ImageSource {
    private static defaultOptions: Required<ImageSourceOptions> = {
        tarURL: undefined,
        imageURL: undefined,
        useWorker: !isMobile(),
        maxCachedImages: 32,
        maxConnectionLimit: 4,
        hierarchicalCacheFraction: 0.3,
        available: undefined,
        image: undefined,
        timeout: -1,
    };

    public options: ImageSourceOptions;
    public index: number = -0;
    public initialized: boolean = false;

    protected context: FastImageSequence;

    constructor(context: FastImageSequence, index: number, options: Partial<ImageSourceOptions>) {
        this.context = context;
        this.index = index;
        this.options = {...ImageSource.defaultOptions, ...options};

        this.initFrames();
    }

    public initFrames() {
        this.context.frames.forEach(frame => frame.images[this.index] ||= new ImageElement(this, frame));
    }

    public get type() {
        return INPUT_CODE;
    }

    public get maxCachedImages() {
        const max = this.initialized ? this.images.filter(a => a.available).length : this.context.options.frames;
        return clamp(Math.floor(this.options.maxCachedImages), 1, max);
    }

    protected get images(): ImageElement[] {
        return this.context.frames.map(frame => frame.images[this.index] as ImageElement);
    }

    /**
     * Set the maximum number of images to cache.
     * @param maxCache - The maximum number of images to cache.
     * @param onProgress - A callback function that is called with the progress of the loading.
     */
    public setMaxCachedImages(maxCache: number, onProgress?: (progress: number) => void): Promise<boolean> {
        this.options.maxCachedImages = maxCache;
        return this.context.onLoadProgress(onProgress);
    }

    public getImageURL(index: number): string | undefined {
        return undefined;
    }

    public checkImageAvailability() {
        for (const image of this.images) {
            image.available = this.available(image, image.available);
        }
        if (!this.images[0]?.available) {
            throw new Error(`No image available for index 0 in ImageSource${this.index} (${this.images[0]?.imageURL})`);
        }
    }

    public async loadResources() {
        this.checkImageAvailability();
        this.initialized = true;
    }

    public process(setLoadingPriority: (maxCachedTreePriorityImages: number) => void) {
        setLoadingPriority(clamp(this.maxCachedImages * this.options.hierarchicalCacheFraction | 0, 0, this.maxCachedImages - 1));
        while (this.releaseImageWithLowestPriority()) {
        }

        let {numLoading, numLoaded} = this.getLoadStatus();
        const maxConnectionLimit = this.options.maxConnectionLimit;
        const imagesToLoad = this.images.filter(a => a.available && a.image === undefined && !a.loading).sort((a, b) => a.frame.priority - b.frame.priority);
        const loadedImages = this.images.filter(a => a.available && a.image !== undefined || a.loading).sort((a, b) => b.frame.priority - a.frame.priority);
        const maxLoadedPriority = loadedImages.shift()?.frame.priority ?? 1e10;

        while (numLoading < maxConnectionLimit && imagesToLoad.length > 0) {
            const image = imagesToLoad.shift() as ImageElement;
            if ((numLoaded < this.maxCachedImages - numLoading || image.frame.priority < maxLoadedPriority - 0.1) && !image.loading) {
                // console.log(`Start loading ${image.frame.index}: ${image.frame.priority}`);
                image.loading = true;
                numLoading++;
                this.fetchImage(image).then((imageElement) => {
                    if (image.loading) {
                        image.image = imageElement;
                        image.loading = false;
                    }
                }).catch((e) => {
                    image.reset();
                    console.error(e);
                });
            }
        }
    }

    public getLoadStatus() {
        const numLoading = this.images.filter(a => a.loading).length;
        const numLoaded = this.images.filter(a => a.image !== undefined).length;
        const maxLoaded = this.maxCachedImages;
        const progress = Math.max(0, numLoaded - numLoading) / Math.max(1, maxLoaded);
        return {progress, numLoading, numLoaded, maxLoaded};
    }

    public async fetchImage(imageElement: ImageElement): Promise<CanvasImageSource> {
        if (this.options.image) {
            return this.options.image(imageElement.frame.index);
        } else {
            return new Promise<CanvasImageSource>((resolve, reject) => {
                reject('Not implemented');
            });
        }
    }

    public destruct() {
        this.images.forEach(image => image.reset());
    }

    protected available(image: ImageElement, available: boolean = true): boolean {
        return this.options.available ? available && this.options.available(image.frame.index) : available;
    }

    private releaseImageWithLowestPriority() {
        const loadedImages = this.images.filter(a => a.image !== undefined && !a.loading);
        if (loadedImages.length > this.maxCachedImages) {
            const sortedFrame = loadedImages.sort((a, b) => a.frame.priority - b.frame.priority).pop();
            if (sortedFrame) {
                // console.log(`Release ${sortedFrame.frame.index} of ${sortedFrame.frame.priority}`);
                sortedFrame.releaseImage();
                return true;
            }
        }
        return false;
    }
}
