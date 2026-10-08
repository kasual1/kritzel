// Style 1 — ASCII noise field over a gradient.
// Characters are picked from a density ramp by fractal noise plus a seeded "hot spot".
import { W, H, svgDoc, linearGradient, grainFilter, vignette, frame, fbm, isMain, runCli } from './lib.mjs';

export const RAMP = ' .·:-=+*#%@';
export const MONO = `font-family="Consolas, 'JetBrains Mono', 'DejaVu Sans Mono', monospace"`;

// Returns [{ level, row, xs[] , y, chars }] grouped per row & level so each level can get its own opacity.
export function asciiField(ctx, { cellW = 15, cellH = 24, hot = null, scale = 1 } = {}) {
  const { rand, noise } = ctx;
  const cx = hot?.x ?? W * (0.55 + rand() * 0.3);
  const cy = hot?.y ?? H * (0.3 + rand() * 0.35);
  const radius = hot?.r ?? 260 + rand() * 120;
  const cols = Math.ceil(W / cellW);
  const rows = Math.ceil(H / cellH);
  const groups = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;
      const n = (fbm(noise, (x / 260) * scale, (y / 260) * scale, 4) + 1) / 2;
      const d = Math.hypot(x - cx, (y - cy) * 1.4) / radius;
      const blob = Math.max(0, 1 - d) ** 1.6;
      const v = Math.min(0.999, Math.max(0, n * 0.8 + blob * 1.1 - 0.22));
      const level = Math.floor(v * RAMP.length);
      if (level === 0) continue;
      const key = `${r}:${level}`;
      if (!groups.has(key)) groups.set(key, { level, y: y + cellH * 0.75, xs: [], chars: '' });
      const g = groups.get(key);
      g.xs.push(x + 2);
      g.chars += RAMP[level];
    }
  }
  return { groups: [...groups.values()], center: { x: cx, y: cy, r: radius } };
}

export function asciiSvg(groups, color, { fontSize = 19, maxOpacity = 0.95 } = {}) {
  return `<g fill="${color}" ${MONO} font-size="${fontSize}">${groups
    .map(
      (g) =>
        `<text x="${g.xs.join(' ')}" y="${g.y.toFixed(1)}" fill-opacity="${(
          0.18 + ((g.level - 1) / (RAMP.length - 2)) ** 0.8 * (maxOpacity - 0.18)
        ).toFixed(2)}">${g.chars.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`,
    )
    .join('')}</g>`;
}

export function generate(ctx) {
  const { palette: p, post } = ctx;
  const vig = vignette('vig', 0.22);
  const { groups } = asciiField(ctx);
  return svgDoc(
    linearGradient('bg', p.bgA, p.bgB, 120) + grainFilter() + vig.def,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     ${asciiSvg(groups, p.light)}
     ${vig.rect}
     <rect width="${W}" height="${H}" filter="url(#grain)"/>
     ${frame(post)}`,
  );
}

if (isMain(import.meta.url)) runCli('ascii', generate);
