import {FastImageSequence} from '../../src/index';

export async function initExamplePlayBackwards(container) {
    const fastImageSequence = new FastImageSequence(container, {
        name: 'PlayBackwardsTest at 200fps',
        frames: 89,
        src: [{
            imageURL: (i) => `${('' + (i + 1)).padStart(4, '0')}.webp`,
        }],
        // optional arguments:
        loop: true, // default false
        objectFit: 'cover', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        clearCanvas: false, // default false
        showDebugInfo: true,
    });

    await fastImageSequence.ready;

    fastImageSequence.progress = 0;

    fastImageSequence.play(-200);
}
