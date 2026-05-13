let buffer;

self.onmessage = async (e) => {
    if (e.data.cmd === 'init') {
        buffer = e.data.buffer;
    } else if (e.data.cmd === 'load') {
        await loadImage(e.data.offset, e.data.size, e.data.index);
    }
};

async function loadImage(offset, size, index) {
    try {
        const view = new Uint8Array(buffer, offset, size);
        const blob = new Blob([view], {});
        const imageBitmap = await createImageBitmap(blob);
        postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
    } catch (e) {
        postMessage({msg: 'error', index, message: String(e && e.message || e)});
    }
}
