import {FastImageSequence} from '../../src/index';

export async function initExamplePlayBackwards(container) {
    const fastImageSequence = new FastImageSequence(container, {
        name: 'PlayBackwardsTest at 200fps',
        frames: 120,
        src: {
            imageURL: (i) => `${('' + (i + 1)).padStart(3, '0')}.jpg`,
        },
        // optional arguments:
        loop: true, // default false
        objectFit: 'contain', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        clearCanvas: false, // default false
        showDebugInfo: true,
    });

    await fastImageSequence.ready();

    fastImageSequence.progress = 0;

    fastImageSequence.play(-200);
}
