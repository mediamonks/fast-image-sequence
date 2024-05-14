import {FastImageSequence} from '../../src/index';

export async function initExampleStillImage(container) {
    const fastImageSequence = new FastImageSequence(container, {
        name: 'StillImageTest',
        frames: 89,
        imageURLCallback: (i) => `${('' + (i + 1)).padStart(4, '0')}.webp`,
        // tarURL: 'lowrespreviews.tar',
        // tarImageURLCallback: (i) => `${('' + (i + 1)).padStart(4, '0')}.jpg`,

        // optional arguments:
        loop: true, // default false
        objectFit: 'cover', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        preloadAllTarImages: false,
        useWorkerForTar: true, // default true
        maxCachedImages: 1, // default 32
        clearCanvas: false, // default false
        showDebugInfo: true,
    });

    await fastImageSequence.ready;

    console.log('fastImageSequence loaded');

    // now the first frame is loaded (numberOfCachedImages = 1), wait for 2 seconds, and then preload the other the frames
    setTimeout(() => {
        fastImageSequence.setMaxCachedImages(89, (progress) => console.log('preload progress:', progress)).then(() => {
            console.log('all frames preloaded');
        });
    }, 2000);
}
