import {FastImageSequence} from '../../src/index';

export async function initExampleStillImage(container) {
    const fastImageSequence = new FastImageSequence(container, {
        name: 'StillImageTest',
        frames: 89,
        src: {
            imageURL: (i) => `sequence_1/${('' + (i + 1)).padStart(4, '0')}.webp`,
            maxCachedImages: 1, // default 32
            useWorker: true,
        },
        // optional arguments:
        loop: true, // default false
        objectFit: 'cover', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        clearCanvas: false, // default false
        showDebugInfo: true,
    });

    await fastImageSequence.ready();

    console.log('fastImageSequence loaded');

    // now the first frame is loaded (numberOfCachedImages = 1), wait for 2 seconds, and then preload the other the frames
    setTimeout(() => {
        fastImageSequence.src.setMaxCachedImages(89, (progress) => console.log('preload progress:', progress)).then(() => {
            console.log('all frames preloaded');
        });
    }, 2000);
}
