import { FastImageSequence } from '../../src/index';

export async function initExamplePlayBackwards(container) {
    const fastImageSequence = new FastImageSequence(container, {
        frames: 89,
        imageURLCallback: (i) => `${('' + (i + 1)).padStart(4, '0')}.webp`,
        // tarURL: '/lowrespreviews.tar',
        // tarImageURLCallback: (i) => `${('' + (i+1)).padStart(4, '0')}.jpg`,

        // optional arguments:
        wrap: true, // default false
        size: 'cover', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        preloadAllTarImages: false,
        useWorkerForTar: true, // default true
        numberOfCachedImages: 32, // default 32
        clearCanvas: false, // default false
    });

    await fastImageSequence.ready;

    fastImageSequence.progress = 0;

    fastImageSequence.play(-30);
}