// Shared helpers for the blog thumbnail generators.
// Every style is a pure function: (ctx) => SVG string. Rendering to PNG happens via resvg.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

export const W = 1200;
export const H = 630;

// ---------- seeded randomness ----------

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 2D simplex noise (seeded) ----------

export function createNoise2D(rand) {
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return function noise(xin, yin) {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    const corner = (x, y, g) => {
      let tt = 0.5 - x * x - y * y;
      if (tt < 0) return 0;
      tt *= tt;
      const gr = grad[g % 8];
      return tt * tt * (gr[0] * x + gr[1] * y);
    };
    n += corner(x0, y0, perm[ii + perm[jj]]);
    n += corner(x1, y1, perm[ii + i1 + perm[jj + j1]]);
    n += corner(x2, y2, perm[ii + 1 + perm[jj + 1]]);
    return 70 * n; // ~[-1, 1]
  };
}

export function fbm(noise, x, y, octaves = 4) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    v += amp * noise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return v; // ~[-1, 1]
}

// ---------- color (OKLCH -> sRGB hex) ----------

export function oklch(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  });
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// Kritzel primary #4A7DFF is roughly oklch(0.62 0.19 264).
const BRAND_HUE = 264;
// Tag -> hue offset, so every category gets a stable color family.
const TAG_HUES = {
  release: 0,
  announcement: 0,
  tutorial: -95, // teal
  guide: -95,
  engineering: 40, // violet
  'deep-dive': 40,
  community: 150, // warm orange
  showcase: -150, // green
};

export function paletteFor(post, rand) {
  const tag = (post.tags ?? []).find((t) => t in TAG_HUES);
  const base = BRAND_HUE + (tag ? TAG_HUES[tag] : 0) + (rand() - 0.5) * 16;
  const h = (x) => ((x % 360) + 360) % 360;
  return {
    hue: h(base),
    bgA: oklch(0.62, 0.17, h(base)),
    bgB: oklch(0.5, 0.19, h(base + 28)),
    light: oklch(0.97, 0.02, h(base)),
    tint: oklch(0.8, 0.1, h(base - 10)),
    deep: oklch(0.32, 0.12, h(base + 20)),
    ink: oklch(0.22, 0.04, h(base)),
    paper: oklch(0.985, 0.006, h(base)),
    accent: oklch(0.8, 0.16, h(base + 180)),
  };
}

// ---------- reusable SVG fragments ----------

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function linearGradient(id, a, b, angleDeg = 135) {
  const r = (angleDeg * Math.PI) / 180;
  const x = Math.cos(r) / 2;
  const y = Math.sin(r) / 2;
  return `<linearGradient id="${id}" x1="${0.5 - x}" y1="${0.5 - y}" x2="${0.5 + x}" y2="${0.5 + y}">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
}

// Film grain via feTurbulence. Subtle, but takes the flat digital look off.
export function grainFilter(id = 'grain', opacity = 0.08) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
  </filter>`;
}

export function vignette(id = 'vig', strength = 0.28) {
  return {
    def: `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${strength}"/></radialGradient>`,
    rect: `<rect width="${W}" height="${H}" fill="url(#${id})"/>`,
  };
}

// The navbar logo (static/img/logo.svg, a single path), read at runtime so thumbnails follow logo changes.
const LOGO_FILE = fileURLToPath(new URL('../../static/img/logo.svg', import.meta.url));
const LOGO_D = fs.readFileSync(LOGO_FILE, 'utf8').match(/\sd="([^"]+)"/)[1];
const LOGO_VIEWBOX = { w: 321.05759, h: 277.97299 };

export function logo(x, y, height, color) {
  const k = height / LOGO_VIEWBOX.h;
  return `<path transform="translate(${x} ${y}) scale(${k.toFixed(5)})" fill="${color}" d="${LOGO_D}"/>`;
}

// Small consistent frame: logo + "kritzel / blog" mark + date.
export function frame(post, color = '#fff', opacity = 0.85) {
  const font = `font-family="Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"`;
  const baseline = H - 52;
  const logoH = 24;
  const logoW = (logoH * LOGO_VIEWBOX.w) / LOGO_VIEWBOX.h;
  return `<g fill="${color}" fill-opacity="${opacity}" ${font} font-size="22">
    ${logo(56, baseline - 8 - logoH / 2, logoH, color)}
    <text x="${56 + logoW + 10}" y="${baseline}" font-weight="700" letter-spacing="-0.3">kritzel<tspan font-weight="400" fill-opacity="0.6" dx="7">/ blog</tspan></text>
    <text x="${W - 56}" y="${baseline}" text-anchor="end" font-weight="400" fill-opacity="0.6">${esc(post.date ?? '')}</text>
  </g>`;
}

export function svgDoc(defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${defs}</defs>${body}</svg>`;
}

// Lucide "mouse-pointer-2" (same as static/img/cursor-default.svg), placed at (x, y).
export function cursor(x, y, scale = 2.4, fill = '#fff', stroke = '#000') {
  return `<g transform="translate(${x} ${y}) scale(${scale}) translate(-4 -4)">
    <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/></g>`;
}

// ---------- rendering ----------

export function renderPng(svg, outFile) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
  });
  const png = resvg.render().asPng();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, png);
  return outFile;
}

export function makeContext(post, seedOverride) {
  const seed = hashString(seedOverride ?? post.slug);
  const rand = mulberry32(seed);
  const noise = createNoise2D(mulberry32(seed ^ 0x9e3779b9));
  return { post, seed, rand, noise, palette: paletteFor(post, mulberry32(seed ^ 0x51ed27)) };
}

// Tiny CLI shared by all style scripts:
//   node scripts/thumbnails/<style>.mjs --slug my-post [--date 2026-08-02] [--tags release] [--out file.png]
export function runCli(styleName, generate) {
  const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, a, i, arr) => {
      if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
      return acc;
    }, []),
  );
  const post = {
    slug: args.slug ?? 'sample-post',
    date: args.date ?? '',
    tags: args.tags ? args.tags.split(',') : [],
  };
  const out = args.out ?? path.join('build', 'thumbnails', `${styleName}-${post.slug}.png`);
  renderPng(generate(makeContext(post, args.seed)), out);
  console.log(`wrote ${out}`);
}

export function isMain(importMetaUrl) {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}

// ---------- raster helpers (for per-pixel styles) ----------

export const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

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

// Minimal RGB PNG encoder. `rgb` is a Uint8Array of w*h*3.
export function encodePng(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
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

// Paints a full-size raster with fn(x, y) => [r, g, b] and returns an <image> element.
export function rasterImage(fn) {
  const rgb = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = fn(x, y);
      const o = (y * W + x) * 3;
      rgb[o] = c[0];
      rgb[o + 1] = c[1];
      rgb[o + 2] = c[2];
    }
  const b64 = encodePng(W, H, rgb).toString('base64');
  return `<image width="${W}" height="${H}" href="data:image/png;base64,${b64}"/>`;
}

// sRGB [0..255] <-> OKLab, used to dither lightness while keeping hue/chroma.
const toLin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function rgbToOklab([R, G, B]) {
  const r = toLin(R), g = toLin(G), b = toLin(B);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.max(0, Math.min(255, fromLin(Math.max(0, v)))));
}
