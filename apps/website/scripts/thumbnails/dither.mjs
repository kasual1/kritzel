// Style 6 — ordered (Bayer 8x8) dithering of a noisy two-tone gradient. 1-bit, print-like.
import { W, H, svgDoc, frame, fbm, isMain, runCli } from './lib.mjs';

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const bayer8 = (x, y) =>
  (4 * BAYER4[y % 4][x % 4] + [[0, 2], [3, 1]][Math.floor(y / 4) % 2][Math.floor(x / 4) % 2]) / 64;

export function generate(ctx) {
  const { palette: p, post, rand, noise } = ctx;
  const px = 5;
  const angle = rand() * Math.PI * 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let d = '';
  for (let j = 0; j < H / px; j++) {
    let run = -1;
    for (let i = 0; i <= W / px; i++) {
      const x = i * px, y = j * px;
      const g = ((x - W / 2) * dx + (y - H / 2) * dy) / (W * 0.9) + 0.5;
      const v = g + fbm(noise, x / 380, y / 380, 3) * 0.45;
      const on = i < W / px && v > bayer8(i, j);
      // merge horizontal runs into one rect to keep the SVG small
      if (on && run < 0) run = i;
      if (!on && run >= 0) {
        d += `M${run * px} ${y}h${(i - run) * px}v${px}h${-(i - run) * px}z`;
        run = -1;
      }
    }
  }
  return svgDoc(
    '',
    `<rect width="${W}" height="${H}" fill="${p.deep}"/>
     <path d="${d}" fill="${p.tint}"/>
     <rect x="40" y="${H - 85}" width="185" height="46" fill="${p.deep}"/>
     <rect x="${W - 185}" y="${H - 85}" width="145" height="46" fill="${p.deep}"/>
     ${frame(post, p.light, 0.95)}`,
  );
}

if (isMain(import.meta.url)) runCli('dither', generate);
