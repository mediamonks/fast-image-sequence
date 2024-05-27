import {FastImageSequence} from '../../src/index';

const prevButton = document.getElementById('prev-button-1');
const nextButton = document.getElementById('next-button-1');
const progress = document.getElementById('slider-input-1');

export async function initExampleWithControl(container) {
    const fastImageSequence = new FastImageSequence(container, {
        name: 'PlayWithControlTest',
        frames: 89,
        src: [
            {
                imageURL: (i) => `${('' + (i + 1)).padStart(4, '0')}.webp`,
                maxCachedImages: 8, // default 32
            },
            {
                tarURL: 'lowrespreviews.tar',
                imageURL: (i) => `${('' + (i + 1)).padStart(4, '0')}.jpg`,
                maxCachedImages: 89,
                useWorker: true,
            }
        ],
        // optional arguments:
        loop: true, // default false
        objectFit: 'contain', // default 'cover'
        fillStyle: '#00000000', // default #00000000
        clearCanvas: false, // default false
        showDebugInfo: true,
    });

    await fastImageSequence.ready();

    fastImageSequence.progress = 0;

    fastImageSequence.tick((dt) => {
        if (fastImageSequence.playing) {
            progress.value = fastImageSequence.progress;
        }
    });

    prevButton.addEventListener('click', () => {
        fastImageSequence.play(-30);
    });
    nextButton.addEventListener('click', () => {
        fastImageSequence.play(30);
    });
    progress.addEventListener('mousedown', (e) => {
        fastImageSequence.stop();
    });
    progress.addEventListener('input', () => {
        if (fastImageSequence.paused) {
            fastImageSequence.progress = progress.value;
        }
    });

    fastImageSequence.play(30);
}
