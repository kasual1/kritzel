// Style 2 — flow-field scribbles. Strokes follow a noise field and taper like a pen
// (drawn as filled outlines, so width varies along the stroke).
import { W, H, svgDoc, grainFilter, frame, fbm, isMain, runCli } from './lib.mjs';

export function taperedStroke(points, maxWidth) {
  if (points.length < 3) return '';
  const left = [];
  const right = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const t = i / (points.length - 1);
    const w = (maxWidth / 2) * Math.sin(Math.PI * t) ** 0.6 + 0.3;
    left.push([points[i][0] - (dy / len) * w, points[i][1] + (dx / len) * w]);
    right.push([points[i][0] + (dy / len) * w, points[i][1] - (dx / len) * w]);
  }
  const pts = left.concat(right.reverse());
  return 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L') + 'Z';
}

export function flowLines(ctx, { count = 170, steps = 90, step = 6, zoom = 520 } = {}) {
  const { rand, noise } = ctx;
  const twist = 1.5 + rand() * 2;
  const lines = [];
  for (let i = 0; i < count; i++) {
    let x = rand() * (W + 200) - 100;
    let y = rand() * (H + 200) - 100;
    const pts = [];
    const n = Math.floor(steps * (0.4 + rand() * 0.6));
    for (let s = 0; s < n; s++) {
      pts.push([x, y]);
      const a = fbm(noise, x / zoom, y / zoom, 2) * Math.PI * twist;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
    }
    lines.push(pts);
  }
  return lines;
}

export function generate(ctx) {
  const { palette: p, post, rand } = ctx;
  const lines = flowLines(ctx);
  const inks = [p.bgA, p.bgB, p.deep];
  const paths = lines
    .map((pts, i) => {
      const accent = i % 37 === 0;
      const color = accent ? p.accent : inks[Math.floor(rand() * inks.length)];
      const width = accent ? 7 : 1.5 + rand() * 4;
      return `<path d="${taperedStroke(pts, width)}" fill="${color}" fill-opacity="${accent ? 0.95 : (0.35 + rand() * 0.5).toFixed(2)}"/>`;
    })
    .join('');
  return svgDoc(
    grainFilter('grain', 0.06) +
      `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.72" stop-color="${p.paper}" stop-opacity="0"/><stop offset="0.9" stop-color="${p.paper}"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="${p.paper}"/>
     ${paths}
     <rect width="${W}" height="${H}" filter="url(#grain)"/>
     <rect width="${W}" height="${H}" fill="url(#fade)"/>
     ${frame(post, p.ink, 0.9)}`,
  );
}

if (isMain(import.meta.url)) runCli('flowfield', generate);
