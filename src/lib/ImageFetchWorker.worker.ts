self.onmessage = async (e) => {
    if (e.data.cmd === 'load') {
        await loadImage(e.data.url, e.data.index);
    }
};

async function loadImage(url: string, index: number) {
    const response = await fetch(url);
    if (!response.ok) throw "network error";
    const imageBitmap = await createImageBitmap(await response.blob());
    // @ts-ignore
    postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
}