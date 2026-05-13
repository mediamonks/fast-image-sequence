// MP4 demuxer + WebCodecs VideoDecoder. Plain JS, loaded as worker source by VideoDecode.ts.

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
        codec = `avc1.${toHex2(profile)}${toHex2(compat)}${toHex2(level)}`;
    } else {
        throw new Error(`Unsupported video codec: ${entry.type}. Only H.264 (avc1/avc3) is supported.`);
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

    // Display order = sorted by CTS (stable). decodeOrder[k] = index into `samples` for k-th decode-order sample.
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
        emit({cmd: 'error', requestId: msg.requestId, message: `Frame index ${displayIndex} out of range`});
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
