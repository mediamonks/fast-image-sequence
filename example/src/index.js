import {FastImageSequence} from '../../dist';
import *  as Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const container = document.getElementsByClassName('container')[0];
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const progress = document.getElementById('slider-input');

async function init() {
    const fastImageSequence = new FastImageSequence(container, {
        frames: 425,
        wrap: false,
        imageURLCallback: (i) => `./static/getty_persepolis_WebGL_intro_comp_v010.1${('' + (i + 1)).padStart(3, '0')}.avif`,
        // tarURL: './static/highres.tar',
        tarURL: './static/lowres.tar',
        tarImageURLCallback: (i) => `getty_persepolis_WebGL_intro_comp_v010.1${('' + (i + 1)).padStart(3, '0')}.avif`,
        // preloadAllTarImages: false,
    });

    await fastImageSequence.ready;

    document.getElementsByClassName('loading')[0].remove();
    fastImageSequence.progress = 0;

    fastImageSequence.tick((dt) => {
        stats.begin();
        if (fastImageSequence.isPlaying) {
            progress.value = fastImageSequence.progress;
        }
        // fastImageSequence.frame = Math.random() * 425;
        stats.end();
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