// Styles 9–12 — combinations of the mesh gradient (7) and ordered dithering (6).
// The mesh is computed per pixel in JS (domain-warped gaussian blobs), so smooth and dithered
// regions share exactly the same colors. Dithering only quantizes lightness (in OKLab), so a dithered
// area keeps the local hue and reads as the same mesh, just drawn in pixel steps.
import { W, H, svgDoc, frame, cursor, oklch, hexToRgb, rasterImage, rgbToOklab, oklabToRgb, isMain, runCli } from './lib.mjs';
import { bayer8 } from './dither.mjs';

export function meshField(ctx) {
  const { palette: p, rand, noise } = ctx;
  const base = hexToRgb(p.bgB);
  const blobs = Array.from({ length: 5 }, (_, i) => ({
    x: rand() * W,
    y: rand() * H,
    s2: 2 * (200 + rand() * 220) ** 2,
    c: hexToRgb(oklch(0.42 + rand() * 0.45, 0.15 + rand() * 0.07, p.hue + (i - 2) * 24 + (rand() - 0.5) * 16)),
  }));
  const colorAt = (x, y) => {
    // domain warp: makes the blobs organic instead of perfectly round
    const wx = x + noise(x / 400, y / 400) * 90;
    const wy = y + noise(x / 400 + 31, y / 400 + 17) * 90;
    let r = base[0] * 0.3, g = base[1] * 0.3, b = base[2] * 0.3, sum = 0.3;
    for (const bl of blobs) {
      const w = Math.exp(-((wx - bl.x) ** 2 + (wy - bl.y) ** 2) / bl.s2);
      r += bl.c[0] * w;
      g += bl.c[1] * w;
      b += bl.c[2] * w;
      sum += w;
    }
    return [r / sum, g / sum, b / sum];
  };
  return { colorAt };
}

// Ordered dither of lightness: snap L to a few levels, the Bayer threshold decides up or down.
export function ditherColor(c, threshold, step = 0.075) {
  const [L, a, b] = rgbToOklab(c);
  const q = Math.floor(L / step + threshold) * step;
  return oklabToRgb([q, a, b]);
}

// Per-cell cache so each dither cell is computed once regardless of its pixel size.
function cellPainter(field, px) {
  const cache = new Map();
  return (x, y) => {
    const cx = Math.floor(x / px);
    const cy = Math.floor(y / px);
    const key = cy * 10000 + cx;
    let c = cache.get(key);
    if (!c) {
      c = ditherColor(field.colorAt(cx * px + px / 2, cy * px + px / 2), bayer8(cx, cy));
      cache.set(key, c);
    }
    return c;
  };
}

const grainy = (c, rand, amount = 9) => {
  const n = (rand() - 0.5) * amount;
  return [c[0] + n, c[1] + n, c[2] + n].map((v) => Math.max(0, Math.min(255, v)));
};

// 9 — the whole mesh rendered as a multi-tone dither.
export function generateFull(ctx) {
  const field = meshField(ctx);
  const paint = cellPainter(field, 6);
  return svgDoc('', rasterImage(paint) + frame(ctx.post));
}

// 10 — smooth mesh that dissolves into dithered pixels along a seeded direction.
export function generateFade(ctx) {
  const { rand, noise } = ctx;
  const field = meshField(ctx);
  const px = 6;
  const paint = cellPainter(field, px);
  const a = rand() * Math.PI * 2;
  const dx = Math.cos(a), dy = Math.sin(a);
  return svgDoc(
    '',
    rasterImage((x, y) => {
      const cx = Math.floor(x / px), cy = Math.floor(y / px);
      const m = ((cx * px - W / 2) * dx + (cy * px - H / 2) * dy) / (W * 0.55) + 0.5 + noise(cx / 25, cy / 25) * 0.2;
      return m > bayer8(cx, cy) ? paint(x, y) : grainy(field.colorAt(x, y), rand);
    }) + frame(ctx.post),
  );
}

// 11 — smooth mesh with a "zoomed-in" selection window that shows the same mesh as pixels.
export function generateLens(ctx) {
  const { rand } = ctx;
  const field = meshField(ctx);
  const paint = cellPainter(field, 10);
  const bw = Math.round((320 + rand() * 140) / 10) * 10;
  const bh = Math.round((190 + rand() * 60) / 10) * 10;
  const bx = Math.round((80 + rand() * (W - bw - 160)) / 10) * 10;
  const by = Math.round((60 + rand() * (H - bh - 190)) / 10) * 10;
  const inside = (x, y) => x >= bx && x < bx + bw && y >= by && y < by + bh;
  const hs = 12;
  const handles = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]
    .map(([x, y]) => `<rect x="${x - hs / 2}" y="${y - hs / 2}" width="${hs}" height="${hs}" rx="2.5" fill="#fff" stroke="${ctx.palette.ink}" stroke-opacity="0.4" stroke-width="1"/>`)
    .join('');
  return svgDoc(
    '',
    rasterImage((x, y) => (inside(x, y) ? paint(x, y) : grainy(field.colorAt(x, y), rand))) +
      `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#fff" stroke-width="2"/>${handles}
       ${cursor(bx + bw + 8, by + bh + 8, 2.1, '#fff', ctx.palette.ink)}` +
      frame(ctx.post),
  );
}

// 12 — resolution steps: smooth on one side, then dithered bands with growing pixel size.
export function generateSteps(ctx) {
  const { rand } = ctx;
  const field = meshField(ctx);
  const sizes = [0, 3, 6, 12, 24];
  const painters = sizes.map((s) => (s ? cellPainter(field, s) : null));
  const reverse = rand() < 0.5;
  const bandW = W / sizes.length;
  return svgDoc(
    '',
    rasterImage((x, y) => {
      let i = Math.min(sizes.length - 1, Math.floor(x / bandW));
      if (reverse) i = sizes.length - 1 - i;
      return painters[i] ? painters[i](x, y) : grainy(field.colorAt(x, y), rand);
    }) + frame(ctx.post),
  );
}

export const VARIANTS = {
  'dither-mesh': generateFull,
  'dither-mesh-fade': generateFade,
  'dither-mesh-lens': generateLens,
  'dither-mesh-steps': generateSteps,
};

// node scripts/thumbnails/dither-mesh.mjs --variant fade --slug my-post
if (isMain(import.meta.url)) {
  const i = process.argv.indexOf('--variant');
  const name = i > 0 ? `dither-mesh-${process.argv[i + 1]}` : 'dither-mesh';
  runCli(name, VARIANTS[name] ?? generateFull);
}
