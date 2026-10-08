// Style 3 — infinite canvas motif: lens-warped dot grid, a selection box with handles and a cursor.
import { W, H, svgDoc, linearGradient, grainFilter, frame, cursor, isMain, runCli } from './lib.mjs';
import { taperedStroke } from './flowfield.mjs';

export function selectionBox(x, y, w, h, color) {
  const hs = 14;
  const handles = [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h],
  ]
    .map(([hx, hy]) => `<rect x="${hx - hs / 2}" y="${hy - hs / 2}" width="${hs}" height="${hs}" rx="3" fill="#fff" stroke="${color}" stroke-width="2.5"/>`)
    .join('');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="2.5"/>${handles}`;
}

export function generate(ctx) {
  const { palette: p, post, rand, noise } = ctx;
  const gap = 30;
  const lens = { x: W * (0.25 + rand() * 0.5), y: H * (0.3 + rand() * 0.4), r: 380 };
  let dots = '';
  for (let gy = -gap; gy < H + gap; gy += gap) {
    for (let gx = -gap; gx < W + gap; gx += gap) {
      const dx = gx - lens.x;
      const dy = gy - lens.y;
      const d = Math.hypot(dx, dy);
      const k = Math.max(0, 1 - d / lens.r);
      // fish-eye push + a touch of noise wobble
      const push = 1 + k * k * 0.55;
      const wob = noise(gx / 300, gy / 300) * 3;
      const x = lens.x + dx * push + wob;
      const y = lens.y + dy * push - wob;
      const r = 1.4 + k * k * 3.2;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill-opacity="${(0.25 + k * 0.5).toFixed(2)}"/>`;
    }
  }
  // one scribble inside the selection — the "content" being selected
  const bw = 300 + rand() * 120;
  const bh = 170 + rand() * 60;
  const bx = Math.min(W - bw - 80, Math.max(80, lens.x - bw / 2));
  const by = Math.min(H - bh - 130, Math.max(60, lens.y - bh / 2));
  // a free-hand loopy scribble, squeezed into the box
  const loop = [];
  const turns = 2 + rand() * 2;
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const a = t * Math.PI * 2 * turns;
    loop.push([
      bx + bw * (0.12 + 0.76 * t) + Math.cos(a) * bh * 0.18,
      by + bh * 0.5 + Math.sin(a) * bh * 0.3 + noise(t * 3, 7) * 18,
    ]);
  }
  return svgDoc(
    linearGradient('bg', p.paper, p.light, 90) + grainFilter('grain', 0.05),
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <g fill="${p.deep}">${dots}</g>
     <path d="${taperedStroke(loop, 9)}" fill="${p.bgA}"/>
     ${selectionBox(bx, by, bw, bh, p.bgA)}
     ${cursor(bx + bw + 6, by + bh + 6, 2.2, '#fff', p.ink)}
     <rect width="${W}" height="${H}" filter="url(#grain)"/>
     ${frame(post, p.ink, 0.85)}`,
  );
}

if (isMain(import.meta.url)) runCli('canvas-grid', generate);
