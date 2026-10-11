// Node side of the thumbnail generator: renders a seed to a PNG file (artwork + text overlay via resvg)
// and stores the seed in the PNG's metadata, so stale images can be detected later.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { W, H } from './lib.mjs';
import { renderArtwork, thumbnailSvg } from './painting.mjs';

// The navbar logo (static/img/logo.svg, a single path), read at runtime so thumbnails follow logo changes.
const LOGO_SVG = fs.readFileSync(fileURLToPath(new URL('../../static/img/logo.svg', import.meta.url)), 'utf8');
const LOGO_VIEWBOX = LOGO_SVG.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
const LOGO = { d: LOGO_SVG.match(/\sd="([^"]+)"/)[1], w: LOGO_VIEWBOX[2], h: LOGO_VIEWBOX[3] };

// ---------- PNG ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// Minimal PNG encoder for RGBA pixels (alpha is dropped, the artwork is opaque).
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      raw[row + 1 + x * 3] = rgba[i];
      raw[row + 2 + x * 3] = rgba[i + 1];
      raw[row + 3 + x * 3] = rgba[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const SEED_KEY = 'kritzel-thumbnail-seed';

// Inserts a tEXt chunk right before IEND (tEXt is Latin-1, so the seed is stored URI-encoded).
function withSeed(png, seed) {
  const text = chunk('tEXt', Buffer.from(`${SEED_KEY}\0${encodeURIComponent(seed)}`, 'latin1'));
  return Buffer.concat([png.subarray(0, png.length - 12), text, png.subarray(png.length - 12)]);
}

// The seed stored in a thumbnail PNG, or null.
export function readSeed(file) {
  if (!fs.existsSync(file)) return null;
  const png = fs.readFileSync(file);
  for (let o = 8; o + 8 <= png.length; ) {
    const len = png.readUInt32BE(o);
    const type = png.toString('ascii', o + 4, o + 8);
    if (type === 'tEXt') {
      const [key, value] = png.toString('latin1', o + 8, o + 8 + len).split('\0');
      if (key === SEED_KEY) return decodeURIComponent(value);
    }
    o += 12 + len;
  }
  return null;
}

// Renders `seed` to `outFile` at `scale` × 1200×630.
export function renderThumbnail(seed, outFile, { scale = 1 } = {}) {
  const art = renderArtwork(seed, { scale });
  const imageHref = `data:image/png;base64,${encodePng(art.width, art.height, art.rgba).toString('base64')}`;
  const svg = thumbnailSvg({ seed: art.seed, label: art.label, logo: LOGO, scale, imageHref });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W * scale },
    font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
  });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, withSeed(resvg.render().asPng(), art.seed));
  return outFile;
}

// Experiment: the artwork only shines through the shape of the Kritzel logo (no label, no seed).
// `background` is a CSS color, 'transparent', or 'dim' (the artwork itself, darkened, around the logo).
export const LOGO_MASK_BACKGROUNDS = { white: '#ffffff', dark: '#141a2b', dim: 'dim', transparent: 'transparent' };

export function renderLogoMask(seed, outFile, { scale = 1, background = 'white', logoHeight = 0.82 } = {}) {
  const art = renderArtwork(seed, { scale });
  const imageHref = `data:image/png;base64,${encodePng(art.width, art.height, art.rgba).toString('base64')}`;
  const bg = LOGO_MASK_BACKGROUNDS[background] ?? background;
  // logo centered, `logoHeight` of the canvas height
  const k = (H * logoHeight) / LOGO.h;
  const x = (W - LOGO.w * k) / 2, y = (H - LOGO.h * k) / 2;
  const image = `<image width="${W}" height="${H}" href="${imageHref}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="logo"><path transform="translate(${x} ${y}) scale(${k})" d="${LOGO.d}"/></clipPath></defs>
  ${bg === 'dim' ? `${image}<rect width="${W}" height="${H}" fill="#000" fill-opacity="0.72"/>` : bg === 'transparent' ? '' : `<rect width="${W}" height="${H}" fill="${bg}"/>`}
  <g clip-path="url(#logo)">${image}</g>
</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W * scale } }).render().asPng();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, withSeed(png, art.seed));
  return outFile;
}
