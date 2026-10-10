// The blog thumbnail style: a Gerhard Richter-like squeegee painting in a framework color family,
// blurred and then redrawn in resolution steps of tone-on-tone dithered pixels.
//   1. underpainting: a domain-warped mesh gradient plus opaque dabs of paint,
//   2. squeegee pulls: bands dragged across the canvas that carry and smear color and skip in streaks,
//      in two layer cycles,
//   3. blur, so the colors flow into each other,
//   4. resolution steps across the width (smooth, 3, 6, 9, 12px): each cell takes the mean paint color and
//      is ordered-dithered in lightness only (OKLab), so pixels keep their hue and read as grain.
//
// The image is fully determined by its seed, an arbitrary string (e.g. `5b1192ef` or `hello kritzel`), and
// resolution independent: geometry lives in logical 1200×630 units, loops run over output pixels at
// an integer `scale`, so a seed renders the same picture at 1×, 2×, 4×… This module is browser-safe.
import { W, H, oklch, hexToRgb, rgbToOklab, oklabToRgb, bayer8, hashString, mulberry32, createNoise2D } from './lib.mjs';
import { FRAMEWORKS, paletteFor } from './palettes.mjs';

export const SCHEME = 'current'; // site-wide color scheme, see palettes.mjs
export const STEPS = [0, 3, 6, 9, 12]; // pixel size per vertical band (logical px), 0 = smooth
export const BLUR = 12; // logical px

// ---------- seeds ----------

export const MAX_SEED_LENGTH = 32;
const HEX_SEED = /^[0-9a-f]{8}$/i;
const FRAMEWORK_NAMES = Object.keys(FRAMEWORKS);

// Any non-empty string of up to 32 printable characters is a seed. Eight hex digits are used directly as the
// 32-bit seed value (that's the form generated seeds take); any other text is hashed. The seed also picks
// the color family (Angular, React or Vue).
export function parseSeed(input) {
  const text = String(input).trim();
  if (!text || text.length > MAX_SEED_LENGTH || /[\u0000-\u001f\u007f]/.test(text))
    throw new Error(`Invalid thumbnail seed "${input}": use 1–${MAX_SEED_LENGTH} printable characters`);
  const hex = HEX_SEED.test(text);
  const value = hex ? parseInt(text, 16) : hashString(text);
  const framework = FRAMEWORK_NAMES[Math.floor(mulberry32(value ^ 0x7f4a7c15)() * FRAMEWORK_NAMES.length)];
  return { text: hex ? text.toLowerCase() : text, framework, value };
}

const hex8 = (n) => (n >>> 0).toString(16).padStart(8, '0');

// Stable seed derived from a key (the blog uses the post slug).
export const seedFor = (key) => hex8(hashString(key));

export function randomSeed() {
  return hex8(globalThis.crypto.getRandomValues(new Uint32Array(1))[0]);
}

export function makeContext(seedText, { scheme = SCHEME } = {}) {
  const { text, framework, value: seed } = parseSeed(seedText);
  const rand = mulberry32(seed);
  const noise = createNoise2D(mulberry32(seed ^ 0x9e3779b9));
  return { seedText: text, framework, seed, rand, noise, palette: paletteFor(framework, mulberry32(seed ^ 0x51ed27), scheme) };
}

// ---------- painting ----------

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Mesh gradient: five gaussian blobs in the palette's mesh colors, domain-warped so they look organic.
// Takes and returns logical coordinates.
function meshField({ palette: p, rand, noise }) {
  const base = p.base;
  const blobs = Array.from({ length: 5 }, (_, i) => {
    const spec = p.mesh[i % p.mesh.length];
    return {
      x: rand() * W,
      y: rand() * H,
      s2: 2 * (200 + rand() * 220) ** 2,
      c: hexToRgb(oklch(spec.L[0] + rand() * (spec.L[1] - spec.L[0]), spec.C * (0.85 + rand() * 0.3), spec.h + (rand() - 0.5) * 16)),
    };
  });
  return (x, y) => {
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
}

// Ordered dither of lightness: snap L to steps, the Bayer threshold decides up or down.
function ditherColor(c, threshold, step = 0.075) {
  const [L, a, b] = rgbToOklab(c);
  return oklabToRgb([Math.floor(L / step + threshold) * step, a, b]);
}

function pick(colors, rand) {
  const total = colors.reduce((s, c) => s + c.w, 0);
  let r = rand() * total;
  for (const c of colors) if ((r -= c.w) <= 0) return c.c;
  return colors[0].c;
}

export class Painting {
  // scale: integer output pixels per logical pixel
  constructor(ctx, scale = 1) {
    if (!Number.isInteger(scale) || scale < 1) throw new Error(`scale must be a positive integer, got ${scale}`);
    this.ctx = ctx;
    this.s = scale;
    this.w = W * scale;
    this.h = H * scale;
    this.rgb = new Float32Array(this.w * this.h * 3);
    this.colors = ctx.palette.paint;
  }

  underpaint() {
    const { s, w, h } = this;
    const colorAt = meshField(this.ctx);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.rgb.set(colorAt(x / s, y / s), (y * w + x) * 3);
    return this.dabs(18, { minR: 60, maxR: 170 }).dabs(380, { minR: 3, maxR: 28 });
  }

  // Opaque, irregular marks of paint in the full palette — raw material for the squeegee.
  // Marks are rotated ellipses with noisy outlines, so small ones read as brush flicks.
  dabs(count, { minR, maxR }) {
    const { rand, noise } = this.ctx;
    const { s, w, h } = this;
    for (let i = 0; i < count; i++) {
      const c = pick(this.colors, rand);
      const rx = minR + rand() ** 2 * (maxR - minR);
      const ry = rx * (0.15 + rand() * 0.7);
      const ang = rand() * Math.PI;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const cx = rand() * W, cy = rand() * H;
      const r = rx * 1.4;
      const off = rand() * 100;
      rand(); // formerly the paint thickness; still drawn so seeds keep their compositions
      for (let py = Math.max(0, Math.floor((cy - r) * s)); py < Math.min(h, (cy + r) * s); py++)
        for (let px = Math.max(0, Math.floor((cx - r) * s)); px < Math.min(w, (cx + r) * s); px++) {
          const x = px / s, y = py / s;
          const lx = (x - cx) * ca + (y - cy) * sa;
          const ly = -(x - cx) * sa + (y - cy) * ca;
          const d = Math.hypot(lx / rx, ly / ry) + noise(x / (rx * 0.7 + 4) + off, y / (rx * 0.7 + 4)) * 0.35;
          const a = smoothstep(1.02, 0.9, d);
          if (a <= 0) continue;
          const o = (py * w + px) * 3;
          for (let k = 0; k < 3; k++) this.rgb[o + k] += (c[k] - this.rgb[o + k]) * a;
        }
    }
    return this;
  }

  // One squeegee pull, axis 'h' drags along x, 'v' along y (pos/width/start/end in logical px).
  // The blade carries a color that keeps picking up what it passes over (so every color edge trails out
  // along the pull) and lays it down through a crisp mask of fine noise stretched along the pull, which
  // produces the streaks and skips that reveal the layers below. `gap` sets how much the blade skips.
  pull({ axis = 'h', pos, width, start, end, color = null, load = 0, gap = 0.3, pickup = 0.12 }) {
    const { noise } = this.ctx;
    const { s, w } = this;
    const along = (axis === 'h' ? W : H) * s;
    const across = (axis === 'h' ? H : W) * s;
    const dir = end >= start ? 1 : -1;
    const len = Math.abs(end - start) || 1;
    const off = (pos * 13.37) % 100;
    // `pickup` is per logical pixel; spread it over the s output pixels the blade passes per logical one
    const perPixel = (p) => 1 - (1 - p) ** (1 / s);
    const u0 = Math.round(start * s), u1 = Math.round(end * s);
    for (let pv = Math.floor((pos - width / 2 - 10) * s); pv < (pos + width / 2 + 10) * s; pv++) {
      if (pv < 0 || pv >= across) continue;
      const v = pv / s;
      let C = null;
      const rowGap = noise(v / 1.6, off) * 0.18; // blade nicks: per-row striations
      for (let pu = u0; dir > 0 ? pu < u1 : pu > u1; pu += dir) {
        if (pu < 0 || pu >= along) continue;
        const u = pu / s;
        const o = ((axis === 'h' ? pv : pu) * w + (axis === 'h' ? pu : pv)) * 3;
        if (!C) C = color ? color.slice() : [this.rgb[o], this.rgb[o + 1], this.rgb[o + 2]];
        // nearly straight blade edges, frayed by fine noise
        const d = width / 2 - Math.abs(v - pos) + noise(u / 300, off + 5) * 3 + noise(u / 6, v / 2 + off) * 2.5;
        const edge = smoothstep(-1, 2, d);
        if (edge <= 0) continue;
        const t = Math.abs(u - start) / len;
        // fresh paint dominates early in the pull and thins out towards the end
        const fresh = color ? load * Math.exp(-t * 2.5) : 0;
        const m =
          noise(u / 40 + off, v / 1.6) * 0.45 +
          noise(u / 7, v / 3 + off) * 0.22 +
          rowGap +
          fresh * 0.5 -
          gap * (0.6 + 0.6 * t);
        const a = smoothstep(-0.015, 0.015, m) * edge;
        const pk = perPixel((color ? pickup * (1 - Math.min(1, fresh)) : pickup) * edge);
        for (let k = 0; k < 3; k++) {
          const old = this.rgb[o + k];
          this.rgb[o + k] = old + (C[k] - old) * a;
          C[k] += (old - C[k]) * pk;
        }
      }
    }
    return this;
  }

  pulls(count = 14, { vertical = 0.3 } = {}) {
    const { rand } = this.ctx;
    // base pass: stacked full-width horizontal pulls, so no part of the underpainting stays untouched
    for (let y = 0; y < H; ) {
      const width = 110 + rand() * 150;
      const forward = rand() < 0.5;
      const fresh = rand() < 0.4;
      this.pull({
        axis: 'h',
        pos: y + width / 2,
        width: width + 8,
        start: forward ? 0 : W,
        end: forward ? W : 0,
        color: fresh ? pick(this.colors, rand) : null,
        load: fresh ? 0.4 + rand() * 0.8 : 0,
        gap: 0.05 + rand() * 0.2,
        pickup: 0.003 + rand() * 0.02,
      });
      y += width;
    }
    for (let i = 0; i < count; i++) {
      const axis = rand() < vertical ? 'v' : 'h';
      const along = axis === 'h' ? W : H;
      const across = axis === 'h' ? H : W;
      const wide = rand() < 0.65;
      const width = wide ? 140 + rand() * 300 : 20 + rand() * 80;
      const full = rand() < 0.6;
      const a = full ? 0 : rand() * along * 0.5;
      const b = full ? along : a + along * (0.35 + rand() * 0.5);
      const forward = rand() < 0.5;
      // about half the pulls bring fresh paint, the others only drag what is already there
      const fresh = rand() < 0.5;
      this.pull({
        axis,
        pos: rand() * across,
        width,
        start: forward ? a : b,
        end: forward ? b : a,
        color: fresh ? pick(this.colors, rand) : null,
        load: fresh ? 0.6 + rand() * 1.2 : 0,
        gap: 0.0 + rand() * 0.3,
        pickup: rand() < 0.25 ? 0.04 : 0.003 + rand() * 0.02,
      });
    }
    return this;
  }

  // Two layer cycles: underpaint, pull, add fresh marks, pull again.
  paint() {
    return this.underpaint().pulls(10).dabs(70, { minR: 8, maxR: 40 }).dabs(6, { minR: 40, maxR: 110 }).pulls(10, { vertical: 0.4 });
  }

  // Approximate gaussian blur: three passes of a separable box blur over the paint colors (r in logical px).
  blur(logicalRadius) {
    const r = Math.round(logicalRadius * this.s);
    const { w, h } = this;
    const tmp = new Float32Array(this.rgb.length);
    const pass = (src, dst, n, m, stride, step) => {
      // n lines of m samples; sample j of line i is at i * stride + j * step
      const win = 2 * r + 1;
      for (let i = 0; i < n; i++)
        for (let k = 0; k < 3; k++) {
          let sum = 0;
          const at = (j) => src[(i * stride + Math.min(m - 1, Math.max(0, j)) * step) * 3 + k];
          for (let j = -r; j <= r; j++) sum += at(j);
          for (let j = 0; j < m; j++) {
            dst[(i * stride + j * step) * 3 + k] = sum / win;
            sum += at(j + r + 1) - at(j - r);
          }
        }
    };
    for (let p = 0; p < 3; p++) {
      pass(this.rgb, tmp, h, w, w, 1);
      pass(tmp, this.rgb, w, h, 1, w);
    }
    this.sat = null;
    return this;
  }

  // Mean color of the size×size output-pixel cell at (x0, y0), via a lazily built summed-area table.
  cellAverage(x0, y0, size) {
    const { w, h } = this;
    if (!this.sat) {
      const sat = new Float64Array((w + 1) * (h + 1) * 3);
      for (let y = 1; y <= h; y++)
        for (let x = 1; x <= w; x++)
          for (let k = 0; k < 3; k++)
            sat[(y * (w + 1) + x) * 3 + k] =
              this.rgb[((y - 1) * w + (x - 1)) * 3 + k] +
              sat[((y - 1) * (w + 1) + x) * 3 + k] +
              sat[(y * (w + 1) + x - 1) * 3 + k] -
              sat[((y - 1) * (w + 1) + x - 1) * 3 + k];
      this.sat = sat;
    }
    const xa = Math.max(0, x0), ya = Math.max(0, y0), xb = Math.min(w, x0 + size), yb = Math.min(h, y0 + size);
    const n = (xb - xa) * (yb - ya) || 1;
    const at = (x, y, k) => this.sat[(y * (w + 1) + x) * 3 + k];
    return [0, 1, 2].map((k) => (at(xb, yb, k) - at(xa, yb, k) - at(xb, ya, k) + at(xa, ya, k)) / n);
  }

  colorAt(x, y) {
    const o = (y * this.w + x) * 3;
    return [this.rgb[o], this.rgb[o + 1], this.rgb[o + 2]];
  }
}

// ---------- rendering ----------

// seed => { width, height, rgba (Uint8ClampedArray, ready for ImageData), label } for the artwork without
// the text overlay. `scale` multiplies the 1200×630 base size.
export function renderArtwork(seedText, { scale = 1, scheme = SCHEME, steps = STEPS, blur = BLUR } = {}) {
  const ctx = makeContext(seedText, { scheme });
  const painting = new Painting(ctx, scale).paint().blur(blur);
  const { w, h, s } = painting;
  const grain = mulberry32(ctx.seed ^ 0x2545f491);
  const reverse = (ctx.seed & 1) === 1; // steps run left→right or right→left, per seed
  const rgba = new Uint8ClampedArray(w * h * 4);
  const cells = new Map();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let i = Math.min(steps.length - 1, Math.floor(x / s / (W / steps.length)));
      if (reverse) i = steps.length - 1 - i;
      let c;
      if (!steps[i]) {
        // smooth band: blurred paint with a little noise grain
        const n = (grain() - 0.5) * 9;
        c = painting.colorAt(x, y).map((v) => v + n);
      } else {
        const size = steps[i] * s;
        const cx = Math.floor(x / size), cy = Math.floor(y / size);
        const key = `${size}:${cx}:${cy}`;
        c = cells.get(key);
        if (!c) {
          c = ditherColor(painting.cellAverage(cx * size, cy * size, size), bayer8(cx, cy));
          cells.set(key, c);
        }
      }
      const o = (y * w + x) * 4;
      rgba[o] = c[0];
      rgba[o + 1] = c[1];
      rgba[o + 2] = c[2];
      rgba[o + 3] = 255;
    }
  return { width: w, height: h, rgba, seed: ctx.seedText, label: { color: '#fff', shade: 0.45, ...ctx.palette.label } };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The text overlay as an SVG document in logical units, sized for `scale`: a darkening gradient, the Kritzel
// logo (`logo` = { d, w, h } of the navbar logo path), "kritzel / blog" and the seed. `imageHref` (a data
// URL of the artwork) is drawn underneath when given, so the result is the complete thumbnail.
export function thumbnailSvg({ seed, label, logo, scale = 1, imageHref = null }) {
  const font = `font-family="Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"`;
  const baseline = H - 52;
  const logoH = 24;
  const logoW = (logoH * logo.w) / logo.h;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${label.shade}"/>
  </linearGradient></defs>
  ${imageHref ? `<image width="${W}" height="${H}" href="${imageHref}"/>` : ''}
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <g fill="${label.color}" fill-opacity="0.85" ${font} font-size="22">
    <path transform="translate(56 ${baseline - 8 - logoH / 2}) scale(${(logoH / logo.h).toFixed(5)})" d="${logo.d}"/>
    <text x="${56 + logoW + 10}" y="${baseline}" font-weight="700" letter-spacing="-0.3">kritzel<tspan font-weight="400" fill-opacity="0.6" dx="7">/ blog</tspan></text>
    <text x="${W - 56}" y="${baseline}" text-anchor="end" font-weight="400" fill-opacity="0.6">${esc(seed)}</text>
  </g>
</svg>`;
}
