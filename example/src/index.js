import {FastImageSequence} from '@mediamonks/fast-image-sequence';

const container = document.getElementsByClassName('container')[0];
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const progress = document.getElementById('slider-input');

async function init() {
    const fastImageSequence = new FastImageSequence(container, {
        frames: 425,
        wrap: false,
        imageURLCallback: (i) => `./public/getty_persepolis_WebGL_intro_comp_v010.1${('' + (i + 1)).padStart(3, '0')}.avif`,
        // tarURL: './public/highres.tar',
        tarURL: './public/lowres.tar',
        tarImageURLCallback: (i) => `getty_persepolis_WebGL_intro_comp_v010.1${('' + (i + 1)).padStart(3, '0')}.avif`,
        // preloadAllTarImages: false,
    });

    await fastImageSequence.ready;

    document.getElementsByClassName('loading')[0].remove();
    fastImageSequence.progress = 0;

    fastImageSequence.tick((dt) => {
        if (fastImageSequence.isPlaying) {
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
        if (fastImageSequence.isPaused) {
            fastImageSequence.progress = progress.value;
        }
    });

    fastImageSequence.play(30);

    console.log(fastImageSequence);
}


init();