// A tiny, dependency-free MP4 reader: just enough of the ISO base media file format to tell whether a blog
// video is web-ready. Used by optimize.mjs and by the website tests, which run without ffmpeg.
import fs from 'node:fs';

/** Reads the boxes in `buffer[start, end)`, without descending. */
function readBoxes(buffer, start, end) {
  const boxes = [];
  let offset = start;
  while (offset + 8 <= end) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buffer.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) {
      throw new Error(`Malformed MP4: box "${type}" at byte ${offset} has an invalid size.`);
    }
    boxes.push({ type, start: offset, bodyStart: offset + header, end: offset + size });
    offset += size;
  }
  return boxes;
}

function child(buffer, box, type) {
  return box && readBoxes(buffer, box.bodyStart, box.end).find((b) => b.type === type);
}

function children(buffer, box, type) {
  return box ? readBoxes(buffer, box.bodyStart, box.end).filter((b) => b.type === type) : [];
}

/** Duration in seconds from an `mvhd` (version 0 or 1). */
function readMovieDuration(buffer, mvhd) {
  const version = buffer.readUInt8(mvhd.bodyStart);
  if (version === 1) {
    const timescale = buffer.readUInt32BE(mvhd.bodyStart + 20);
    const duration = Number(buffer.readBigUInt64BE(mvhd.bodyStart + 24));
    return duration / timescale;
  }
  const timescale = buffer.readUInt32BE(mvhd.bodyStart + 12);
  const duration = buffer.readUInt32BE(mvhd.bodyStart + 16);
  return duration / timescale;
}

/** Display width and height from a `tkhd`: the last 8 bytes, as 16.16 fixed point numbers. */
function readTrackSize(buffer, tkhd) {
  return {
    width: Math.round(buffer.readUInt32BE(tkhd.end - 8) / 65536),
    height: Math.round(buffer.readUInt32BE(tkhd.end - 4) / 65536),
  };
}

/**
 * Inspects an MP4 file or buffer.
 * @returns {{
 *   size: number, duration: number, bitrate: number, faststart: boolean, fragmented: boolean, topLevel: string[],
 *   tracks: { handler: string, codec: string | null, width: number, height: number }[],
 *   video: { codec: string | null, width: number, height: number } | null, hasAudio: boolean,
 * }}
 */
export function inspectMp4(fileOrBuffer) {
  const buffer = Buffer.isBuffer(fileOrBuffer) ? fileOrBuffer : fs.readFileSync(fileOrBuffer);
  const top = readBoxes(buffer, 0, buffer.length);
  const types = top.map((box) => box.type);
  const moov = top.find((box) => box.type === 'moov');
  const mdat = top.find((box) => box.type === 'mdat');
  if (!moov) {
    throw new Error('Not a playable MP4: it has no "moov" box.');
  }
  const mvhd = child(buffer, moov, 'mvhd');
  const duration = mvhd ? readMovieDuration(buffer, mvhd) : 0;

  const tracks = children(buffer, moov, 'trak').map((trak) => {
    const mdia = child(buffer, trak, 'mdia');
    const hdlr = child(buffer, mdia, 'hdlr');
    // hdlr: version/flags (4), pre_defined (4), handler_type (4)
    const handler = hdlr ? buffer.toString('latin1', hdlr.bodyStart + 8, hdlr.bodyStart + 12) : 'unknown';
    const stsd = child(buffer, child(buffer, child(buffer, mdia, 'minf'), 'stbl'), 'stsd');
    // stsd: version/flags (4), entry_count (4), then the first sample entry box
    const codec = stsd ? buffer.toString('latin1', stsd.bodyStart + 12, stsd.bodyStart + 16) : null;
    const tkhd = child(buffer, trak, 'tkhd');
    return { handler, codec, ...(tkhd ? readTrackSize(buffer, tkhd) : { width: 0, height: 0 }) };
  });
  const videoTrack = tracks.find((track) => track.handler === 'vide');

  return {
    size: buffer.length,
    duration,
    bitrate: duration > 0 ? (buffer.length * 8) / duration : 0,
    // The browser needs `moov` before it can show the first frame, so it must come before the media data.
    faststart: !mdat || moov.start < mdat.start,
    // Fragmented files (OBS, MediaRecorder) keep their samples in `moof` boxes and report no duration in `mvhd`.
    fragmented: types.includes('moof'),
    topLevel: types,
    tracks,
    video: videoTrack ? { codec: videoTrack.codec, width: videoTrack.width, height: videoTrack.height } : null,
    hasAudio: tracks.some((track) => track.handler === 'soun'),
  };
}
