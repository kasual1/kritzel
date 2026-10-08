// Style 5 — topographic contours via marching squares over fractal noise. One level is highlighted.
import { W, H, svgDoc, linearGradient, grainFilter, frame, fbm, isMain, runCli } from './lib.mjs';

function field(ctx, res) {
  const { noise, rand } = ctx;
  const ox = rand() * 100;
  const oy = rand() * 100;
  const cols = Math.ceil(W / res) + 2;
  const rows = Math.ceil(H / res) + 2;
  const v = [];
  for (let j = 0; j < rows; j++) {
    v.push([]);
    for (let i = 0; i < cols; i++) v[j].push(fbm(noise, ox + (i * res) / 420, oy + (j * res) / 420, 3));
  }
  return { v, cols, rows };
}

export function contourPath({ v, cols, rows }, res, level) {
  let d = '';
  const lerp = (a, b) => (level - a) / (b - a);
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], e = v[j + 1][i];
      const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (e > level ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x = i * res, y = j * res;
      const top = [x + lerp(a, b) * res, y];
      const right = [x + res, y + lerp(b, c) * res];
      const bottom = [x + lerp(e, c) * res, y + res];
      const left = [x, y + lerp(a, e) * res];
      const segs = {
        1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
        5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
        9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]],
        13: [[bottom, right]], 14: [[left, bottom]],
      }[idx];
      for (const [p1, p2] of segs) d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
  }
  return d;
}

export function generate(ctx) {
  const { palette: p, post, rand } = ctx;
  const res = 8;
  const f = field(ctx, res);
  const levels = 16;
  const hiLevel = 4 + Math.floor(rand() * 8);
  let lines = '';
  for (let k = 0; k < levels; k++) {
    const level = -0.6 + (k / (levels - 1)) * 1.2;
    const d = contourPath(f, res, level);
    const isHi = k === hiLevel;
    lines += `<path d="${d}" fill="none" stroke="${isHi ? p.accent : p.light}" stroke-opacity="${isHi ? 1 : k % 4 === 0 ? 0.5 : 0.22}" stroke-width="${isHi ? 3 : k % 4 === 0 ? 1.8 : 1.1}" stroke-linecap="round"/>`;
  }
  return svgDoc(
    linearGradient('bg', p.deep, p.bgB, 160) + grainFilter('grain', 0.07),
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>${lines}
     <rect width="${W}" height="${H}" filter="url(#grain)"/>${frame(post)}`,
  );
}

if (isMain(import.meta.url)) runCli('contours', generate);
