import {FastImageSequence} from '../../../src/index';

const prevButton = document.getElementById('prev-button-4');
const nextButton = document.getElementById('next-button-4');
const progress = document.getElementById('slider-input-4');

// bigbuckbunny-gop5.mp4: 300 frames at 30 fps, 1280×720 H.264 main yuv420p,
// re-encoded from the pristine source with GOP=5, B-frames enabled, -tune fastdecode, CRF 23.
const VIDEO_FRAMES = 300;
const VIDEO_FPS = 30;

export async function initExampleVideo(container) {
    const fastImageSequence = new FastImageSequence(container, {
        name: 'VideoSourceTest (WebCodecs)',
        frames: VIDEO_FRAMES,
        src: {
            videoURL: 'bigbuckbunny-gop5.mp4',
            maxCachedImages: 64,
        },
        loop: true,
        objectFit: 'cover',
        showDebugInfo: true,
    });

    await fastImageSequence.ready();

    fastImageSequence.tick(() => {
        if (fastImageSequence.playing) {
            progress.value = fastImageSequence.progress;
        }
    });

    prevButton.addEventListener('click', () => fastImageSequence.play(-30));
    nextButton.addEventListener('click', () => fastImageSequence.play(30));
    progress.addEventListener('mousedown', () => fastImageSequence.stop());
    progress.addEventListener('input', () => {
        if (fastImageSequence.paused) {
            fastImageSequence.progress = parseFloat(progress.value);
        }
    });

    fastImageSequence.play(VIDEO_FPS);
}
