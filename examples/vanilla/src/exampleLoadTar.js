import {FastImageSequence} from '../../../src/index';

const prevButton = document.getElementById('prev-button-2');
const nextButton = document.getElementById('next-button-2');
const progress = document.getElementById('slider-input-2');

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = _e => resolve(reader.result);
        reader.onerror = _e => reject(reader.error);
        reader.onabort = _e => reject(new Error("Read aborted"));
        reader.readAsDataURL(blob);
    });
}

export async function initExampleLoadTar(container) {
    // load tar file with lowres previews
    fetch('lowrespreviews.tar').then(async (response) => {
        const blob = await response.blob();
        const dataURL = await blobToDataURL(blob);

        const fastImageSequence = new FastImageSequence(container, {
            name: 'LoadTar',
            frames: 89,
            src: [
                {
                    tarURL: dataURL,
                    imageURL: (i) => `${('' + (i + 1)).padStart(4, '0')}.jpg`,
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
    });
}
