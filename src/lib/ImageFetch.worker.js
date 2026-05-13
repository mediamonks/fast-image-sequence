self.onmessage = async (e) => {
    if (e.data.cmd === 'load') {
        await loadImage(e.data.url, e.data.index);
    }
};

async function loadImage(url, index) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const imageBitmap = await createImageBitmap(await response.blob());
        postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
    } catch (e) {
        postMessage({msg: 'error', index, message: String(e && e.message || e)});
    }
}
