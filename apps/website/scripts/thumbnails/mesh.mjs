// Style 7 — mesh-gradient blobs: a few heavily blurred circles in related hues, plus grain.
import { W, H, svgDoc, grainFilter, frame, oklch, isMain, runCli } from './lib.mjs';

export function generate(ctx) {
  const { palette: p, post, rand } = ctx;
  const blobs = Array.from({ length: 4 }, (_, i) => {
    const hue = p.hue + (i - 1.5) * 26 + (rand() - 0.5) * 20;
    const color = oklch(0.55 + rand() * 0.25, 0.16 + rand() * 0.06, hue);
    const r = 220 + rand() * 200;
    return `<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * H).toFixed(0)}" r="${r.toFixed(0)}" fill="${color}"/>`;
  }).join('');
  return svgDoc(
    `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter>` +
      grainFilter('grain', 0.12),
    `<rect width="${W}" height="${H}" fill="${p.bgB}"/>
     <g filter="url(#blur)">${blobs}</g>
     <rect width="${W}" height="${H}" filter="url(#grain)"/>
     ${frame(post)}`,
  );
}

if (isMain(import.meta.url)) runCli('mesh', generate);
