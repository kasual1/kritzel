// Style 4 — Truchet tiles: quarter-circle arcs in a grid, randomly rotated, forming meandering lines.
// The longest connected line through the tiles is traced and highlighted in the accent color.
import { W, H, svgDoc, linearGradient, grainFilter, vignette, frame, isMain, runCli } from './lib.mjs';

// Edges: 0 = top, 1 = right, 2 = bottom, 3 = left.
// flip = true connects top<->left and right<->bottom, otherwise top<->right and left<->bottom.
const PAIR = { true: [3, 2, 1, 0], false: [1, 0, 3, 2] };
const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function generate(ctx) {
  const { palette: p, post, rand } = ctx;
  const s = 70;
  const r = s / 2;
  const cols = Math.ceil(W / s) + 1;
  const rows = Math.ceil(H / s) + 1;
  const flips = Array.from({ length: rows }, () => Array.from({ length: cols }, () => rand() < 0.5));

  const mid = (i, j, e) => {
    const x = i * s, y = j * s;
    return [[x + r, y], [x + s, y + r], [x + r, y + s], [x, y + r]][e];
  };
  // one quarter arc from edge a to edge b inside tile (i, j); sweep picks the side around the tile corner
  const arc = (i, j, a, b) => {
    const [x1, y1] = mid(i, j, a);
    const [x2, y2] = mid(i, j, b);
    const sweep = (b - a + 4) % 4 === 1 ? 0 : 1;
    return `M${x1} ${y1}A${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
  };

  let all = '';
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const pair = PAIR[flips[j][i]];
      all += arc(i, j, 0, pair[0]) + arc(i, j, 2, pair[2]);
    }

  // trace connected lines and keep the longest one
  const trace = (i, j, enter) => {
    let d = '';
    let n = 0;
    const seen = new Set();
    while (i >= 0 && j >= 0 && i < cols && j < rows && n < 400) {
      const key = `${i},${j},${Math.min(enter, PAIR[flips[j][i]][enter])}`;
      if (seen.has(key)) break;
      seen.add(key);
      const exit = PAIR[flips[j][i]][enter];
      d += arc(i, j, enter, exit);
      i += STEP[exit][0];
      j += STEP[exit][1];
      enter = (exit + 2) % 4;
      n++;
    }
    return { d, n };
  };
  let best = { d: '', n: 0 };
  for (let k = 0; k < 40; k++) {
    const t = trace(Math.floor(rand() * cols), Math.floor(rand() * rows), Math.floor(rand() * 4));
    if (t.n > best.n) best = t;
  }

  const vig = vignette('vig', 0.3);
  return svgDoc(
    linearGradient('bg', p.bgA, p.bgB, 135) + grainFilter() + vig.def,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <path d="${all}" fill="none" stroke="${p.light}" stroke-opacity="0.22" stroke-width="7" stroke-linecap="round"/>
     <path d="${best.d}" fill="none" stroke="${p.accent}" stroke-width="7" stroke-linecap="round"/>
     ${vig.rect}
     <rect width="${W}" height="${H}" filter="url(#grain)"/>
     ${frame(post)}`,
  );
}

if (isMain(import.meta.url)) runCli('truchet', generate);
