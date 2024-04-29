import {FastImageSequence} from '../../src/index';

export function constructDestructTest(container) {
    let fastImageSequence = createFastImageSequence(container);

    // construct a FastImageSequence every 3 seconds, and destruct it after 5 seconds
    setInterval(() => {
        console.log('destructing');
        fastImageSequence.destruct();
        console.log('constructing');
        fastImageSequence = createFastImageSequence(container);
    }, 3000);
}

function createFastImageSequence(container) {
    const fastImageSequence = new FastImageSequence(container, {
        frames: 89,
        imageURLCallback: (i) => `${('' + (i + 1)).padStart(4, '0')}.webp`,
        tarURL: (Math.random() > .5 ? 'lowrespreviews.tar' : undefined),
        tarImageURLCallback: (i) => `${('' + (i + 1)).padStart(4, '0')}.jpg`,

        // optional arguments:
        wrap: Math.random() > .5, // default false
        size: Math.random() > .5 ? 'cover' : 'contain', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        preloadAllTarImages: Math.random() > .5,
        useWorkerForTar: Math.random() > .5, // default true
        numberOfCachedImages: (1+Math.random()*32)|0, // default 32
        clearCanvas: Math.random() > .5, // default false
        showDebugInfo: true,
    });

    fastImageSequence.ready.then(() => {
        fastImageSequence.tick(() => fastImageSequence.progress = Math.random());
    });

    return fastImageSequence;
}
