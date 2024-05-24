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
    const src = [];

    const imageSrc = {
        imageURL: (i) => `${('' + (i + 1)).padStart(4, '0')}.webp`,
        useWorker: Math.random() > .5, // default true
        maxCachedImages: (1 + Math.random() * 32) | 0, // default 32
    };
    const tarSrc = {
        tarURL: 'lowrespreviews.tar',
        imageURL: (i) => `${('' + (i + 1)).padStart(4, '0')}.jpg`,
        useWorker: Math.random() > .5, // default true
        maxCachedImages: (1 + Math.random() * 32) | 0, // default 32
    };

    const srcType = Math.random() * 3 | 0;
    if (srcType === 0) {
        src.push(imageSrc);
    } else if (srcType === 1) {
        src.push(tarSrc);
    } else {
        src.push(imageSrc, tarSrc);
    }

    const fastImageSequence = new FastImageSequence(container, {
        name: 'ConstructDestructTest',
        frames: 89,
        src,
        // optional arguments:
        loop: Math.random() > .5, // default false
        objectFit: Math.random() > .5 ? 'cover' : 'contain', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        clearCanvas: Math.random() > .5, // default false
        showDebugInfo: true,
        poster: '0001.webp',
    });

    fastImageSequence.ready().then(() => {
        fastImageSequence.tick(() => fastImageSequence.progress = Math.random());
    });

    return fastImageSequence;
}
