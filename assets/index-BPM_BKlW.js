(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{index;images=[];priority=0;treePriority=0;constructor(e){this.index=e}get image(){return this.images.find(e=>e.image!==void 0)?.image}async getImage(){if(this.image!==void 0)return this.image;let e=this.images[this.images.length-1];if(!e)throw Error(`Frame has no image sources`);return e.fetchImage()}async fetchImage(){return this.images.find(e=>e.available)?.fetchImage()}releaseImage(){this.images.forEach(e=>e.releaseImage())}reset(){this.images.forEach(e=>e.reset())}};function t(){let e=document.createElement(`pre`);return Object.assign(e.style,{position:`absolute`,top:`0`,left:`0`,backgroundColor:`rgba(0, 0, 0, 0.5)`,color:`white`,padding:`8px`,fontSize:`12px`,zIndex:`1000`,lineHeight:`20px`,margin:0,width:`calc(100% - 16px)`}),e}function n(e,t){e.textContent=`${t}`}function r(e){(e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame)&&e.close()}var i=class{available=!0;loading=!1;frame;_image;context;constructor(e,t){this.context=e,this.frame=t}get image(){if(this._image!==void 0&&!this.loading)return this._image}set image(e){e!==this._image&&(this.releaseImage(),this._image=e)}get imageURL(){return this.context.getImageURL(this.frame.index)}reset(){this.releaseImage(),this._image=void 0}async fetchImage(){return this.context.fetchImage(this)}releaseImage(){this._image&&=(r(this._image),void 0),this.loading=!1}},a=class e{static defaultOptions={tarURL:void 0,imageURL:void 0,videoURL:void 0,useWorker:!S(),maxCachedImages:32,maxConnectionLimit:4,hierarchicalCacheFraction:.3,available:void 0,image:void 0,timeout:-1};options;index=0;initialized=!1;context;images=[];downloadProgress=0;constructor(t,n,r){this.context=t,this.index=n,this.options={...e.defaultOptions,...r},this.initFrames()}initFrames(){this.context.frames.forEach(e=>e.images[this.index]||=new i(this,e)),this.images=this.context.frames.map(e=>e.images[this.index])}get type(){return 2}get maxCachedImages(){let e=this.initialized?this.images.filter(e=>e.available).length:this.context.options.frames;return C(Math.floor(this.options.maxCachedImages),1,e)}setMaxCachedImages(e,t){return this.options.maxCachedImages=e,this.context.onLoadProgress(t)}getImageURL(e){}checkImageAvailability(){for(let e of this.images)e.available=this.available(e,e.available);if(!this.images[0]?.available)throw Error(`No image available for index 0 in ImageSource${this.index} (${this.images[0]?.imageURL})`)}async loadResources(){this.checkImageAvailability(),this.initialized=!0}process(e){for(e(C(this.maxCachedImages*this.options.hierarchicalCacheFraction|0,0,this.maxCachedImages-1));this.releaseImageWithLowestPriority(););let{numLoading:t,numLoaded:n}=this.getLoadStatus(),i=this.options.maxConnectionLimit,a=this.images.filter(e=>e.available&&e.image===void 0&&!e.loading).sort((e,t)=>e.frame.priority-t.frame.priority),o=this.images.filter(e=>e.available&&e.image!==void 0||e.loading).sort((e,t)=>t.frame.priority-e.frame.priority).shift()?.frame.priority??1e10;for(;t<i&&a.length>0;){let e=a.shift();(n<this.maxCachedImages-t||e.frame.priority<o-.1)&&!e.loading&&(e.loading=!0,t++,this.fetchImage(e).then(t=>{e.loading?(e.image=t,e.loading=!1):r(t)}).catch(t=>{e.reset(),console.error(t)}))}}getLoadStatus(){let e=0,t=0;for(let n of this.images)n.loading&&e++,n.image!==void 0&&t++;let n=this.maxCachedImages,r=Math.max(0,t-e)/Math.max(1,n);return this.downloadProgress<1&&(r=this.downloadProgress/2+r/2),{progress:r,numLoading:e,numLoaded:t,maxLoaded:n}}async fetchImage(e){return this.options.image?this.options.image(e.frame.index):new Promise((e,t)=>{t(`Not implemented`)})}destruct(){this.images.forEach(e=>e.reset())}available(e,t=!0){return this.options.available?t&&this.options.available(e.frame.index):t}releaseImageWithLowestPriority(){let e=0,t;for(let n of this.images)n.image===void 0||n.loading||(e++,(!t||n.frame.priority>t.frame.priority)&&(t=n));return e>this.maxCachedImages&&t?(t.releaseImage(),!0):!1}};function o(e,t){return new Promise((n,r)=>{let i=new XMLHttpRequest;i.open(`GET`,e,!0),i.responseType=`arraybuffer`,i.onprogress=function(e){e.lengthComputable&&t&&t(e.loaded/e.total)},i.onload=function(){i.status===200?(t&&t(1),n(i.response)):r(Error(`Error ${i.status}: ${i.statusText}`))},i.onerror=function(){r(Error(`Request failed`))},i.send()})}function s(e,t){return new Promise((n,r)=>{e.onerror=e=>r(e),e.decoding=`async`,e.src=t,e.decode().then(()=>n(e)).catch(r)})}function c(e){let t=new Blob([e],{type:`application/javascript`});return new Worker(URL.createObjectURL(t))}var l=`let buffer;

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
`,u=class{fileInfo=[];buffer;options;worker;pending=new Map;defaultOptions={useWorker:!0};constructor(e,t={}){this.buffer=e,this.options={...this.defaultOptions,...t};let n=0;for(;n<e.byteLength-512;){let e=this.readFileName(n);if(e.length==0)break;let t=this.readFileSize(n);this.fileInfo.push({name:e,size:t,header_offset:n}),n+=512+512*Math.trunc(t/512),t%512&&(n+=512)}}getInfo(e){return this.fileInfo.find(t=>t.name===e||t.name.endsWith(`/`+e))}getImage(e,t){return new Promise((n,r)=>{let i=this.getInfo(e);if(!i){r(Error(`Tarball: file not found "${e}"`));return}if(this.pending.has(t)){r(Error(`Image already loading from tar`));return}if(this.options.useWorker)this.worker||=this.createWorker(),this.pending.set(t,{resolve:n,reject:r}),this.worker.postMessage({cmd:`load`,offset:i.header_offset+512,size:i.size,index:t});else if(this.buffer){let e=new Uint8Array(this.buffer,i.header_offset+512,i.size);createImageBitmap(new Blob([e],{type:`image`})).then(n).catch(r)}else r(Error(`Tarball: buffer already released`))})}destruct(){this.worker&&this.worker.terminate(),this.worker=void 0,this.pending.clear(),this.buffer=void 0}readFileName(e){let t=new Uint8Array(this.buffer,e,100),n=t.indexOf(0);return new TextDecoder().decode(t.slice(0,n))}readFileSize(e){let t=new Uint8Array(this.buffer,e+124,12),n=``;for(let e=0;e<11;e++)n+=String.fromCharCode(t[e]);return parseInt(n,8)}createWorker(){let e=c(l);return e.addEventListener(`message`,e=>{let t=this.pending.get(e.data.index);if(this.pending.delete(e.data.index),e.data.msg===`error`){t&&t.reject(Error(e.data.message));return}t?t.resolve(e.data.imageBitmap):r(e.data.imageBitmap)}),e.postMessage({cmd:`init`,buffer:this.buffer},[this.buffer]),e}},d=class extends a{tarball;get type(){return 1}async loadResources(){if(this.options.tarURL!==void 0){let e=await o(this.options.tarURL,e=>this.downloadProgress=e);this.tarball=new u(e,{useWorker:this.options.useWorker}),this.context.log(`Tarball`,this.tarball)}return super.loadResources()}getImageURL(e){return this.options.imageURL?this.options.imageURL(e):void 0}async fetchImage(e){if(!e.available)throw Error(`Tarball image not available: ${e.imageURL}`);return await this.tarball.getImage(e.imageURL||``,e.frame.index)}destruct(){super.destruct(),this.tarball?.destruct(),this.tarball=void 0}available(e,t=!0){return t=t&&e.imageURL!==void 0&&this.tarball?.getInfo(e.imageURL)!==void 0,super.available(e,t)}},f=`self.onmessage = async (e) => {
    if (e.data.cmd === 'load') {
        await loadImage(e.data.url, e.data.index);
    }
};

async function loadImage(url, index) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(\`HTTP \${response.status} \${response.statusText}\`);
        const imageBitmap = await createImageBitmap(await response.blob());
        postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
    } catch (e) {
        postMessage({msg: 'error', index, message: String(e && e.message || e)});
    }
}
`,p=class{index=-1;worker;resolve;reject;constructor(){this.worker=c(f),this.worker.addEventListener(`message`,e=>{if(e.data.index!==this.index){e.data.imageBitmap&&r(e.data.imageBitmap);return}e.data.msg===`error`?this.reject?.(Error(e.data.message)):this.resolve?this.resolve(e.data.imageBitmap):r(e.data.imageBitmap)})}load(e,t){return this.index=e,new Promise((n,r)=>{this.resolve=n,this.reject=r,this.worker.postMessage({cmd:`load`,url:t,index:e})})}abort(){this.index=-1,this.resolve=void 0,this.reject=void 0}},m=[];function h(){return m.length===0&&m.push(new p),m.shift()}function g(e){e.abort(),m.push(e)}var _=class extends a{get type(){return 0}getImageURL(e){return this.options.imageURL?new URL(this.options.imageURL(e),window.location.href).href:void 0}async fetchImage(e){return new Promise((t,n)=>{if(e.imageURL)if(this.options.useWorker){let r=h();r.load(this.index,e.imageURL).then(e=>{t(e),g(r)}).catch(e=>n(e))}else{let r=new Image;s(r,e.imageURL).then(()=>{t(r)}).catch(e=>n(e))}else n(`Image url not set or image already loading`)})}},v=`// MP4 demuxer + WebCodecs VideoDecoder. Plain JS, loaded as worker source by VideoDecode.ts.

const emit = (msg, transfer) => self.postMessage(msg, transfer || []);

let buffer;
let view;
let samples = [];        // display order; each entry: {offset, size, dts, isKey, decodeIndex, displayIndex}
let decodeOrder = [];    // same entries, indexed by decodeIndex
let codec;
let description;
let codedWidth;
let codedHeight;

let decoder;
let pending = [];        // [{requestId, displayIndex}]

function readBox(offset) {
    if (offset + 8 > view.byteLength) return null;
    let size = view.getUint32(offset);
    const type = String.fromCharCode(view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7));
    let headerSize = 8;
    if (size === 1) {
        size = view.getUint32(offset + 8) * 0x100000000 + view.getUint32(offset + 12);
        headerSize = 16;
    } else if (size === 0) {
        size = view.byteLength - offset;
    }
    return {type, size, headerSize, offset, payloadOffset: offset + headerSize};
}

function walk(parent, callback) {
    const end = parent.offset + parent.size;
    let cursor = parent.payloadOffset;
    while (cursor < end) {
        const box = readBox(cursor);
        if (!box) break;
        if (callback(box) === false) return;
        cursor += box.size;
    }
}

function findChild(parent, type) {
    let result;
    walk(parent, box => {
        if (box.type === type) {
            result = box;
            return false;
        }
    });
    return result;
}

function findPath(parent, path) {
    let cur = parent;
    for (const seg of path) {
        cur = findChild(cur, seg);
        if (!cur) return undefined;
    }
    return cur;
}

function findVideoTrak(moov) {
    let result;
    walk(moov, box => {
        if (box.type !== 'trak') return;
        const hdlr = findPath(box, ['mdia', 'hdlr']);
        if (!hdlr) return;
        const handlerType = String.fromCharCode(view.getUint8(hdlr.payloadOffset + 8), view.getUint8(hdlr.payloadOffset + 9), view.getUint8(hdlr.payloadOffset + 10), view.getUint8(hdlr.payloadOffset + 11));
        if (handlerType === 'vide') {
            result = box;
            return false;
        }
    });
    return result;
}

function readSampleEntry(stbl) {
    const stsd = findChild(stbl, 'stsd');
    if (!stsd) throw new Error('stsd box not found');
    const entry = readBox(stsd.payloadOffset + 8);
    if (!entry) throw new Error('No sample entry in stsd');

    codedWidth = view.getUint16(entry.payloadOffset + 24);
    codedHeight = view.getUint16(entry.payloadOffset + 26);

    if (entry.type === 'avc1' || entry.type === 'avc3') {
        const config = readBox(entry.payloadOffset + 78);
        if (!config || config.type !== 'avcC') throw new Error('avcC box not found');
        const descBytes = new Uint8Array(buffer, config.payloadOffset, config.size - config.headerSize);
        description = descBytes.slice();
        const profile = view.getUint8(config.payloadOffset + 1);
        const compat = view.getUint8(config.payloadOffset + 2);
        const level = view.getUint8(config.payloadOffset + 3);
        codec = \`avc1.\${toHex2(profile)}\${toHex2(compat)}\${toHex2(level)}\`;
    } else {
        throw new Error(\`Unsupported video codec: \${entry.type}. Only H.264 (avc1/avc3) is supported.\`);
    }
}

function toHex2(n) {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

function readSampleTable(stbl) {
    const stsz = findChild(stbl, 'stsz');
    const stsc = findChild(stbl, 'stsc');
    const stco = findChild(stbl, 'stco') || findChild(stbl, 'co64');
    const stts = findChild(stbl, 'stts');
    const stss = findChild(stbl, 'stss');
    const ctts = findChild(stbl, 'ctts');
    if (!stsz || !stsc || !stco || !stts) throw new Error('Required stbl child boxes missing');

    const sizes = readStsz(stsz);
    const sampleCount = sizes.length;
    const offsets = readOffsets(stsc, stco, sampleCount, sizes);
    const dtsList = readStts(stts, sampleCount);
    const ctsOffsets = ctts ? readCtts(ctts, sampleCount) : null;
    const keySet = stss ? readStss(stss) : null;

    const decode = new Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
        decode[i] = {
            offset: offsets[i],
            size: sizes[i],
            dts: dtsList[i],
            cts: ctsOffsets ? dtsList[i] + ctsOffsets[i] : dtsList[i],
            isKey: keySet ? keySet.has(i + 1) : true,
            decodeIndex: i,
        };
    }

    // Display order = sorted by CTS (stable). decodeOrder[k] = index into \`samples\` for k-th decode-order sample.
    const displayOrder = [...decode].sort((a, b) => a.cts - b.cts || a.decodeIndex - b.decodeIndex);
    samples = displayOrder.map((s, displayIndex) => ({
        offset: s.offset,
        size: s.size,
        dts: s.dts,
        isKey: s.isKey,
        decodeIndex: s.decodeIndex,
        displayIndex,
    }));

    decodeOrder = new Array(sampleCount);
    for (const s of samples) decodeOrder[s.decodeIndex] = s;
}

function readStsz(box) {
    const sampleSize = view.getUint32(box.payloadOffset + 4);
    const count = view.getUint32(box.payloadOffset + 8);
    const sizes = new Array(count);
    if (sampleSize !== 0) {
        for (let i = 0; i < count; i++) sizes[i] = sampleSize;
    } else {
        for (let i = 0; i < count; i++) sizes[i] = view.getUint32(box.payloadOffset + 12 + i * 4);
    }
    return sizes;
}

function readOffsets(stsc, stco, sampleCount, sizes) {
    const chunkCount = view.getUint32(stco.payloadOffset + 4);
    const is64 = stco.type === 'co64';
    const chunkOffsets = new Array(chunkCount);
    for (let i = 0; i < chunkCount; i++) {
        const base = stco.payloadOffset + 8 + i * (is64 ? 8 : 4);
        chunkOffsets[i] = is64 ? view.getUint32(base) * 0x100000000 + view.getUint32(base + 4) : view.getUint32(base);
    }

    const entryCount = view.getUint32(stsc.payloadOffset + 4);
    const entries = new Array(entryCount);
    for (let i = 0; i < entryCount; i++) {
        const base = stsc.payloadOffset + 8 + i * 12;
        entries[i] = {firstChunk: view.getUint32(base), samplesPerChunk: view.getUint32(base + 4)};
    }

    const offsets = new Array(sampleCount);
    let sampleCursor = 0;
    for (let e = 0; e < entries.length && sampleCursor < sampleCount; e++) {
        const startChunk = entries[e].firstChunk - 1;
        const endChunk = e + 1 < entries.length ? entries[e + 1].firstChunk - 1 : chunkCount;
        const samplesPerChunk = entries[e].samplesPerChunk;
        for (let c = startChunk; c < endChunk && sampleCursor < sampleCount; c++) {
            let off = chunkOffsets[c];
            for (let s = 0; s < samplesPerChunk && sampleCursor < sampleCount; s++) {
                offsets[sampleCursor] = off;
                off += sizes[sampleCursor];
                sampleCursor++;
            }
        }
    }
    return offsets;
}

function readStts(box, sampleCount) {
    const entryCount = view.getUint32(box.payloadOffset + 4);
    const dts = new Array(sampleCount);
    let sampleCursor = 0;
    let t = 0;
    for (let i = 0; i < entryCount && sampleCursor < sampleCount; i++) {
        const count = view.getUint32(box.payloadOffset + 8 + i * 8);
        const delta = view.getUint32(box.payloadOffset + 12 + i * 8);
        for (let s = 0; s < count && sampleCursor < sampleCount; s++) {
            dts[sampleCursor++] = t;
            t += delta;
        }
    }
    return dts;
}

function readCtts(box, sampleCount) {
    const entryCount = view.getUint32(box.payloadOffset + 4);
    const offsets = new Array(sampleCount);
    let sampleCursor = 0;
    for (let i = 0; i < entryCount && sampleCursor < sampleCount; i++) {
        const count = view.getUint32(box.payloadOffset + 8 + i * 8);
        const offset = view.getInt32(box.payloadOffset + 12 + i * 8);
        for (let s = 0; s < count && sampleCursor < sampleCount; s++) offsets[sampleCursor++] = offset;
    }
    return offsets;
}

function readStss(box) {
    const count = view.getUint32(box.payloadOffset + 4);
    const set = new Set();
    for (let i = 0; i < count; i++) set.add(view.getUint32(box.payloadOffset + 8 + i * 4));
    return set;
}

function findKeyDecodeIndexAtOrBefore(decodeIndex) {
    for (let i = decodeIndex; i >= 0; i--) if (decodeOrder[i].isKey) return i;
    return 0;
}

function configureDecoder() {
    decoder = new VideoDecoder({
        output: onDecodedFrame,
        error: (e) => emit({cmd: 'error', message: String(e && e.message || e)}),
    });
    decoder.configure({codec, description, codedWidth, codedHeight, optimizeForLatency: true});
}

function onDecodedFrame(frame) {
    // We pass decodeIndex as the chunk timestamp; the decoder echoes it on the output frame.
    const decIndex = Math.round(Number(frame.timestamp));
    const displayIndex = decodeOrder[decIndex]?.displayIndex ?? -1;

    const matchIdx = pending.findIndex(p => p.displayIndex === displayIndex);
    if (matchIdx === -1) {
        frame.close();
        return;
    }
    const req = pending.splice(matchIdx, 1)[0];
    emit({cmd: 'frame', requestId: req.requestId, frame}, [frame]);
}

function handleInit(msg) {
    buffer = msg.buffer;
    view = new DataView(buffer);

    let moov;
    let cursor = 0;
    while (cursor < view.byteLength) {
        const box = readBox(cursor);
        if (!box) break;
        if (box.type === 'moov') {
            moov = box;
            break;
        }
        cursor += box.size;
    }
    if (!moov) throw new Error('moov box not found');

    const trak = findVideoTrak(moov);
    if (!trak) throw new Error('Video track not found');
    const stbl = findPath(trak, ['mdia', 'minf', 'stbl']);
    if (!stbl) throw new Error('stbl box not found');

    readSampleEntry(stbl);
    readSampleTable(stbl);

    configureDecoder();
    emit({cmd: 'ready', frames: samples.length, width: codedWidth, height: codedHeight});
}

async function handleDecode(msg) {
    const displayIndex = msg.index;
    if (displayIndex < 0 || displayIndex >= samples.length) {
        emit({cmd: 'error', requestId: msg.requestId, message: \`Frame index \${displayIndex} out of range\`});
        return;
    }
    const targetDecodeIndex = samples[displayIndex].decodeIndex;
    const keyDecodeIndex = findKeyDecodeIndexAtOrBefore(targetDecodeIndex);

    // WebCodecs requires a keyframe after every flush(), so each request decodes its own
    // keyframe → target run from scratch. Reference state is not shared between requests.
    decoder.reset();
    decoder.configure({codec, description, codedWidth, codedHeight, optimizeForLatency: true});
    pending = [{requestId: msg.requestId, displayIndex}];
    for (let i = keyDecodeIndex; i <= targetDecodeIndex; i++) submitChunk(i);
    await decoder.flush();
}

function submitChunk(decodeIndex) {
    const s = decodeOrder[decodeIndex];
    const data = new Uint8Array(buffer, s.offset, s.size);
    const chunk = new EncodedVideoChunk({
        type: s.isKey ? 'key' : 'delta',
        timestamp: decodeIndex,
        data,
    });
    decoder.decode(chunk);
}

function handleDestroy() {
    if (decoder && decoder.state !== 'closed') decoder.close();
    decoder = undefined;
    pending = [];
    samples = [];
    decodeOrder = [];
    buffer = undefined;
    view = undefined;
}

self.addEventListener('message', async (e) => {
    try {
        const msg = e.data;
        if (msg.cmd === 'init') handleInit(msg);
        else if (msg.cmd === 'decode') await handleDecode(msg);
        else if (msg.cmd === 'destroy') handleDestroy();
    } catch (err) {
        emit({cmd: 'error', message: String(err && err.message || err)});
    }
});
`,y=class{info;ready;worker;nextRequestId=0;pending=new Map;readyResolve;readyReject;destructed=!1;constructor(e){if(typeof VideoDecoder>`u`)throw Error(`WebCodecs VideoDecoder is not available in this browser`);this.worker=c(v),this.ready=new Promise((e,t)=>{this.readyResolve=e,this.readyReject=t}),this.worker.addEventListener(`message`,e=>this.onMessage(e.data)),this.worker.addEventListener(`error`,e=>{let t=e.message||`Worker error`;this.info?console.error(`VideoDecode worker error:`,t):this.readyReject(Error(t))}),this.worker.postMessage({cmd:`init`,buffer:e},[e])}getFrame(e){if(this.destructed)return Promise.reject(Error(`VideoDecode destructed`));let t=this.nextRequestId++;return new Promise((n,r)=>{this.pending.set(t,{resolve:n,reject:r}),this.worker.postMessage({cmd:`decode`,requestId:t,index:e})})}destruct(){if(!this.destructed){this.destructed=!0;for(let{reject:e}of this.pending.values())e(Error(`VideoDecode destructed`));this.pending.clear(),this.worker.postMessage({cmd:`destroy`}),this.worker.terminate()}}onMessage(e){if(e.cmd===`ready`)this.info={frames:e.frames,width:e.width,height:e.height},this.readyResolve(this.info);else if(e.cmd===`frame`){let t=this.pending.get(e.requestId);t?(this.pending.delete(e.requestId),t.resolve(e.frame)):e.frame.close()}else if(e.cmd===`error`)if(e.requestId!==void 0&&this.pending.has(e.requestId))this.pending.get(e.requestId).reject(Error(e.message)),this.pending.delete(e.requestId);else if(!this.info)this.readyReject(Error(e.message));else{console.error(`VideoDecode error:`,e.message);for(let{reject:t}of this.pending.values())t(Error(e.message));this.pending.clear()}}},b=class extends a{decoder;constructor(e,t,n){super(e,t,{...n,maxConnectionLimit:1,useWorker:!0})}get type(){return 3}async loadResources(){if(this.options.videoURL!==void 0){let e=await o(this.options.videoURL,e=>this.downloadProgress=e);this.decoder=new y(e);let t=await this.decoder.ready;this.context.options.frames!==t.frames&&this.context.log(`ImageSourceVideo: options.frames (${this.context.options.frames}) does not match video frame count (${t.frames})`)}return super.loadResources()}async fetchImage(e){if(!this.decoder)throw Error(`VideoDecode not initialized`);return this.decoder.getFrame(e.frame.index)}destruct(){super.destruct(),this.decoder?.destruct(),this.decoder=void 0}available(e,t=!0){let n=this.decoder?.info;return t=t&&n!==void 0&&e.frame.index<n.frames,super.available(e,t)}},x={0:`image:`,1:`tar:  `,2:`code: `,3:`video:`};function S(){return typeof navigator<`u`&&/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function C(e,t,n){return Math.min(Math.max(e,t),n)}var w=class i{static defaultOptions={frames:1,src:[],loop:!1,poster:void 0,fillStyle:`#00000000`,objectFit:`cover`,clearCanvas:!1,showDebugInfo:!1,name:`FastImageSequence`,horizontalAlign:.5,verticalAlign:.5,scale:1};canvas;options;width=0;height=0;frame=0;log;frames=[];sources=[];context;tickFunctions=[];startTime=-1;animationRequestId=0;container;resizeObserver;mutationObserver;inViewportObserver;forceRedraw=!0;speed=0;prevFrame=0;direction=1;lastFrameDrawn=-1;destructed=!1;logElement;initialized=!1;posterImage;timeFrameVisible=0;lastImageDrawn;inViewport=!1;containerWidth=0;containerHeight=0;constructor(n,r){if(this.options={...i.defaultOptions,...r},this.options.frames<=0)throw Error(`FastImageSequence: frames must be greater than 0`);this.container=n,this.canvas=document.createElement(`canvas`),this.context=this.canvas.getContext(`2d`),this.context.fillStyle=this.options.fillStyle,this.context.imageSmoothingQuality=`high`,this.context.clearRect(0,0,this.canvas.width,this.canvas.height),Object.assign(this.canvas.style,{width:`100%`,height:`100%`,margin:`0`,display:`block`}),this.container.appendChild(this.canvas),this.resizeObserver=new ResizeObserver(()=>{this.forceRedraw=!0,this.containerWidth=n.offsetWidth,this.containerHeight=n.offsetHeight,this.lastFrameDrawn<0&&this.posterImage&&this.drawImage(this.posterImage)}),this.resizeObserver.observe(this.canvas),this.mutationObserver=new MutationObserver(()=>{this.container.isConnected||(console.error(`FastImageSequence: container is not connected to the DOM, fast image sequence will be destroyed`),this.destruct())}),this.mutationObserver.observe(n,{childList:!0}),this.inViewportObserver=new IntersectionObserver(e=>{for(let t of e)this.inViewport=t.isIntersecting}),this.inViewportObserver.observe(this.canvas),this.frames=Array.from({length:this.options.frames},(t,n)=>new e(n)),this.setTreePriority(),this.log=this.options.showDebugInfo?console.log:()=>{};let o=this.options.src instanceof Array?this.options.src:[this.options.src];this.sources=o.map((e,t)=>e.videoURL===void 0?e.tarURL===void 0?e.imageURL===void 0?new a(this,t,e):new _(this,t,e):new d(this,t,e):new b(this,t,e)),this.loadResources().then(()=>{this.initialized=!0,this.log(`Frames`,this.frames),this.log(`Options`,this.options),this.options.showDebugInfo&&(this.logElement=t(),this.container.appendChild(this.logElement),this.tick(()=>this.logDebugStatus(this.logElement))),this.drawingLoop(-1)})}get playing(){return this.speed!==0}get paused(){return!this.playing}get loadProgress(){return this.sources.reduce((e,t)=>e+t.getLoadStatus().progress,0)/this.sources.length}get progress(){return this.index/(this.options.frames-1)}set progress(e){this.frame=(this.options.frames-1)*e}set scale(e){this.forceRedraw=this.options.scale!==e,this.options.scale=e}get scale(){return this.options.scale}set horizontalAlign(e){this.forceRedraw=this.options.horizontalAlign!==e,this.options.horizontalAlign=e}get horizontalAlign(){return this.options.horizontalAlign}set verticalAlign(e){this.forceRedraw=this.options.verticalAlign!==e,this.options.verticalAlign=e}get verticalAlign(){return this.options.verticalAlign}get src(){return this.sources[0]}set frameCount(t){for(let e of this.frames)e.reset();this.forceRedraw=!0;let n=Math.max(1,t|0);this.options.frames=n,n<this.frames.length?this.frames=Array.from({length:n},(t,n)=>new e(n)):n>this.frames.length&&(this.frames=this.frames.concat(Array.from({length:n-this.frames.length},(t,n)=>new e(n+this.frames.length))));for(let e of this.sources)e.initFrames(),e.checkImageAvailability();this.setTreePriority()}get frameCount(){return this.options.frames}get index(){return this.wrapIndex(this.frame)}ready(){return new Promise(e=>{let t=()=>{this.sources.every(e=>e.initialized)?e():setTimeout(t,16)};t()})}tick(e){this.tickFunctions.push(e)}play(e=30){this.speed=e}stop(){this.speed=0}async getFrameImage(e){return await this.frames[this.wrapIndex(e)].fetchImage()}async onLoadProgress(e){let t=this.loadProgress;return new Promise(n=>{let r=()=>{this.loadProgress>=1?(e&&e(1),n(!0)):(e&&t!==this.loadProgress&&(e(this.loadProgress),t=this.loadProgress),setTimeout(r,16))};r()})}destruct(){this.destructed||(this.destructed=!0,this.animationRequestId&&cancelAnimationFrame(this.animationRequestId),this.resizeObserver.disconnect(),this.mutationObserver.disconnect(),this.inViewportObserver.disconnect(),this.container.removeChild(this.canvas),this.logElement&&=(this.container.removeChild(this.logElement),void 0),this.canvas.replaceWith(this.canvas.cloneNode(!0)),this.sources.forEach(e=>e.destruct()),this.frames.forEach(e=>e.releaseImage()))}setDisplayOptions(e){this.options={...this.options,...e},this.forceRedraw=!0}setTreePriority(){for(let e of this.frames)e.treePriority=1-e.index/(this.frameCount*2);let e=0;for(let t=1;t<=this.frames.length;t=t*2+1,e++)for(let e of this.frames)(e.index&t)===0&&(e.treePriority+=1);for(let t of this.frames)t.treePriority=t.index===this.frameCount-1?0:Math.max(0,1-t.treePriority/e)}setLoadingPriority(e=0){let t=this.index,n=(this.options.loop?2:1)/Math.max(1,this.frames.length);for(let e of this.frames){let r=Math.abs(e.index+.25-t);this.options.loop&&(r=Math.min(r,this.options.frames-r)),e.priority=r*n+1}e>0&&this.frames.sort((e,t)=>e.treePriority-t.treePriority).slice(0,e).forEach(e=>e.priority=e.treePriority)}async loadResources(){if(this.options.poster){this.log(`Poster image`,this.options.poster);let e=new Image;e.src=this.options.poster,await e.decode().then(()=>{this.posterImage=e,this.lastFrameDrawn<0&&this.drawImage(this.posterImage)}).catch(e=>this.log(e))}await Promise.all(this.sources.map(e=>e.loadResources()));let e=await this.getFrameImage(0);e&&r(e)}wrapIndex(e){let t=e|0;return this.wrapFrame(t)}wrapFrame(e){return this.options.loop?(e%this.options.frames+this.options.frames)%this.options.frames:C(e,0,this.options.frames-1)}async drawingLoop(e=0){if(this.destructed)return;e/=1e3;let t=0;if(this.initialized&&(t=this.startTime<0?1/60:Math.min(e-this.startTime,1/30)),this.startTime=e>0?e:-1,this.frame-this.prevFrame<0&&(this.direction=-1),this.frame-this.prevFrame>0&&(this.direction=1),this.frame+=this.speed*t,this.frame=this.wrapFrame(this.frame),this.inViewport){let e=this.index,t=Math.sign(this.frame-this.prevFrame),n=this.direction*t===-1?this.frames.length:0,r,i=1/0;for(let t of this.frames){if(t.image===void 0)continue;let a=Math.abs(t.index-e);this.options.loop&&(a=Math.min(a,this.options.frames-a)),a+=n,a<i&&(i=a,r=t)}r&&this.drawFrame(r)}this.wrapIndex(this.frame)===this.wrapIndex(this.prevFrame)?this.timeFrameVisible+=t:this.timeFrameVisible=0,this.process(),this.tickFunctions.forEach(e=>e(t)),this.prevFrame=this.frame,this.animationRequestId=requestAnimationFrame(e=>this.drawingLoop(e))}drawFrame(e){let t=e.image;!t||e.index>=this.options.frames||(this.lastFrameDrawn=e.index,this.drawImage(t))}drawImage(e){let t=e.naturalWidth||e.width||e.videoWidth||e.displayWidth||e.codedWidth,n=e.naturalHeight||e.height||e.videoHeight||e.displayHeight||e.codedHeight;this.width=Math.max(this.width,t),this.height=Math.max(this.height,n);let r=window.devicePixelRatio||1,i=Math.max(1,Math.round(this.containerWidth*r)),a=Math.max(1,Math.round(this.containerHeight*r));(this.canvas.width!==i||this.canvas.height!==a)&&(this.canvas.width=i,this.canvas.height=a,this.context.imageSmoothingQuality=`high`,this.forceRedraw=!0);let o=i/a,s=this.width/this.height,c=this.options.scale,l,u;this.options.objectFit===`contain`?o>s?(u=a,l=a*s):(l=i,u=i/s):o>s?(l=i,u=i/s):(u=a,l=a*s),l*=c,u*=c;let d=(i-l)*this.options.horizontalAlign,f=(a-u)*this.options.verticalAlign;(this.forceRedraw||this.options.clearCanvas)&&this.context.clearRect(0,0,i,a),(this.forceRedraw||this.options.clearCanvas||this.lastImageDrawn!==e)&&(this.context.drawImage(e,0,0,t,n,d,f,l,u),this.lastImageDrawn=e),this.forceRedraw=!1}process(){for(let e of this.sources)this.timeFrameVisible>=e.options.timeout/1e3&&e.process((e=0)=>this.setLoadingPriority(e))}logDebugStatus(e){let t=e=>`${Math.abs(e*100).toFixed(1).padStart(5,` `)}%`,r=`${this.options.name} - frames: ${this.frames.length}, loop: ${this.options.loop}, objectFit: ${this.options.objectFit}\n loadProgress ${t(this.loadProgress)}, last frame drawn ${this.lastFrameDrawn}/${this.index}\n`;for(let e of this.sources){let{progress:n,numLoading:i,numLoaded:a,maxLoaded:o}=e.getLoadStatus();r+=` src[${e.index}] ${x[e.type]??`?     `} ${t(n)}, numLoading: ${i}, numLoaded: ${a}/${o}${e.options.useWorker?`, use worker`:``}\n`}n(e,r)}},T=document.getElementById(`prev-button-1`),E=document.getElementById(`next-button-1`),D=document.getElementById(`slider-input-1`);async function O(e){let t=new w(e,{name:`PlayWithControlTest`,frames:89,src:[{imageURL:e=>`${(``+(e+1)).padStart(4,`0`)}.webp`,maxCachedImages:8},{tarURL:`lowrespreviews.tar`,imageURL:e=>`${(``+(e+1)).padStart(4,`0`)}.jpg`}],loop:!0,objectFit:`contain`,fillStyle:`#00000000`,clearCanvas:!1,showDebugInfo:!0});await t.ready(),t.progress=0,t.tick(e=>{t.playing&&(D.value=t.progress)}),T.addEventListener(`click`,()=>{t.play(-30)}),E.addEventListener(`click`,()=>{t.play(30)}),D.addEventListener(`mousedown`,e=>{t.stop()}),D.addEventListener(`input`,()=>{t.paused&&(t.progress=D.value)}),t.play(30)}var k=document.getElementById(`prev-button-4`),A=document.getElementById(`next-button-4`),j=document.getElementById(`slider-input-4`),M=300,N=30;async function P(e){let t=new w(e,{name:`VideoSourceTest (WebCodecs)`,frames:M,src:{videoURL:`bigbuckbunny-gop5.mp4`,maxCachedImages:64},loop:!0,objectFit:`cover`,showDebugInfo:!0});await t.ready(),t.tick(()=>{t.playing&&(j.value=t.progress)}),k.addEventListener(`click`,()=>t.play(-30)),A.addEventListener(`click`,()=>t.play(30)),j.addEventListener(`mousedown`,()=>t.stop()),j.addEventListener(`input`,()=>{t.paused&&(t.progress=parseFloat(j.value))}),t.play(N)}async function F(e){let t=new w(e,{name:`StillImageTest`,frames:89,src:{imageURL:e=>`${(``+(e+1)).padStart(4,`0`)}.webp`,maxCachedImages:1,useWorker:!0},loop:!0,objectFit:`cover`,fillStyle:`#00000000`,clearCanvas:!1,showDebugInfo:!0});await t.ready(),console.log(`fastImageSequence loaded`),setTimeout(()=>{t.src.setMaxCachedImages(89,e=>console.log(`preload progress:`,e)).then(()=>{console.log(`all frames preloaded`)})},2e3)}function I(e){let t=L(e);setInterval(()=>{console.log(`destructing`),t.destruct(),console.log(`constructing`),t=L(e)},3e3)}function L(e){let t=[],n={imageURL:e=>`${(``+(e+1)).padStart(4,`0`)}.webp`,useWorker:Math.random()>.5,maxCachedImages:1+Math.random()*32|0},r={tarURL:`lowrespreviews.tar`,imageURL:e=>`${(``+(e+1)).padStart(4,`0`)}.jpg`,useWorker:Math.random()>.5,maxCachedImages:1+Math.random()*32|0},i=Math.random()*3|0;i===0?t.push(n):i===1?t.push(r):t.push(n,r);let a=new w(e,{name:`ConstructDestructTest`,frames:89,src:t,loop:Math.random()>.5,objectFit:Math.random()>.5?`cover`:`contain`,fillStyle:`#00000000`,clearCanvas:Math.random()>.5,showDebugInfo:!0,poster:`0001.webp`});return a.ready().then(()=>{a.tick(()=>a.progress=Math.random())}),a}var R=document.getElementById(`prev-button-2`),z=document.getElementById(`next-button-2`),B=document.getElementById(`slider-input-2`);function V(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=e=>t(r.result),r.onerror=e=>n(r.error),r.onabort=e=>n(Error(`Read aborted`)),r.readAsDataURL(e)})}async function H(e){fetch(`lowrespreviews.tar`).then(async t=>{let n=new w(e,{name:`LoadTar`,frames:89,src:[{tarURL:await V(await t.blob()),imageURL:e=>`${(``+(e+1)).padStart(4,`0`)}.jpg`}],loop:!0,objectFit:`contain`,fillStyle:`#00000000`,clearCanvas:!1,showDebugInfo:!0});await n.ready(),n.tick(e=>{n.playing&&(B.value=n.progress)}),R.addEventListener(`click`,()=>{n.play(-30)}),z.addEventListener(`click`,()=>{n.play(30)}),B.addEventListener(`mousedown`,e=>{n.stop()}),B.addEventListener(`input`,()=>{n.paused&&(n.progress=B.value)}),n.play(30)})}var U=document.getElementById(`prev-button-3`),W=document.getElementById(`next-button-3`),G=document.getElementById(`slider-input-3`);function K(e,t){let n=document.createElement(`canvas`);n.width=512,n.height=512;let r=n.getContext(`2d`);r.fillStyle=`#000000`,r.fillRect(0,0,n.width,n.height);let i=e/t*Math.PI/2,a=n.width/2,o=n.height/2,s=[[-128,-128,-128],[128,-128,-128],[128,128,-128],[-128,128,-128],[-128,-128,128],[128,-128,128],[128,128,128],[-128,128,128]],c=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];r.strokeStyle=`#ffffff`,r.beginPath();for(let e of c){let t=s[e[0]],n=s[e[1]],c=1e3/(1e3+t[0]*Math.sin(i)+t[2]*Math.cos(i)),l=1e3/(1e3+n[0]*Math.sin(i)+n[2]*Math.cos(i)),u=a+(t[0]*Math.cos(i)-t[2]*Math.sin(i))*c,d=o+t[1]*c,f=a+(n[0]*Math.cos(i)-n[2]*Math.sin(i))*l,p=o+n[1]*l;r.moveTo(u,d),r.lineTo(f,p)}return r.stroke(),n}async function q(e){let t=new w(e,{name:`CustomCanvas`,frames:100,src:[{image:e=>K(e,100),maxCachedImages:100}],loop:!0,objectFit:`contain`,fillStyle:`#00000000`,clearCanvas:!1,showDebugInfo:!0});await t.ready(),t.progress=0,t.tick(e=>{t.playing&&(G.value=t.progress)}),U.addEventListener(`click`,()=>{t.play(-30)}),W.addEventListener(`click`,()=>{t.play(30)}),G.addEventListener(`mousedown`,e=>{t.stop()}),G.addEventListener(`input`,()=>{t.paused&&(t.progress=G.value)}),t.play(30)}O(document.getElementsByClassName(`grid-item`)[0]),P(document.getElementsByClassName(`grid-item`)[1]),H(document.getElementsByClassName(`grid-item`)[2]),F(document.getElementsByClassName(`grid-item`)[3]),q(document.getElementsByClassName(`grid-item`)[4]),I(document.getElementsByClassName(`grid-item`)[5]);