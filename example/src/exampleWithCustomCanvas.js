import {FastImageSequence} from '../../src/index';

const prevButton = document.getElementById('prev-button-3');
const nextButton = document.getElementById('next-button-3');
const progress = document.getElementById('slider-input-3');

function createCustomCanvas(index, total) {
    // create 512x512 black canvas with rotating cube around y axis
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const angle = (index / total) * Math.PI / 2;
    const size = 128;
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const vertices = [
        [-size, -size, -size],
        [size, -size, -size],
        [size, size, -size],
        [-size, size, -size],
        [-size, -size, size],
        [size, -size, size],
        [size, size, size],
        [-size, size, size],
    ];
    const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
    ];

    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    for (const edge of edges) {
        const p0 = vertices[edge[0]];
        const p1 = vertices[edge[1]];

        const z0pd = 1000 / (1000 + p0[0] * Math.sin(angle) + p0[2] * Math.cos(angle));
        const z1pd = 1000 / (1000 + p1[0] * Math.sin(angle) + p1[2] * Math.cos(angle));

        const x0 = x + (p0[0] * Math.cos(angle) - p0[2] * Math.sin(angle)) * z0pd;
        const y0 = y + p0[1] * z0pd;
        const x1 = x + (p1[0] * Math.cos(angle) - p1[2] * Math.sin(angle)) * z1pd;
        const y1 = y + p1[1] * z1pd;


        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
    }
    ctx.stroke();

    return canvas;
}

export async function initExampleWithCustomCanvas(container) {
    const frames = 100;
    const fastImageSequence = new FastImageSequence(container, {
        name: 'CustomCanvas',
        frames,
        src: [
            {
                image: (i) => createCustomCanvas(i, frames),
                maxCachedImages: frames,
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
