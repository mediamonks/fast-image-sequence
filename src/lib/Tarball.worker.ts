let buffer: Uint8Array;

self.onmessage = async (e) => {
    if (e.data.cmd === 'init') {
        buffer = e.data.buffer;
    } else if (e.data.cmd === 'load') {
        loadImage(e.data.offset, e.data.size, e.data.index);
    }
};

async function loadImage(offset: number, size: number, index: number) {
    const view = new Uint8Array(buffer, offset, size);
    const blob = new Blob([view], {});
    const imageBitmap = await createImageBitmap(blob);
    // @ts-ignore
    postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
}