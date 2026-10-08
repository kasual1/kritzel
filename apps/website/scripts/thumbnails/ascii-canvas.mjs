// Style 8 (recommended combo) — gradient + ASCII density field, with a selection box
// framing the densest region and a cursor as the brand signature.
import { W, H, svgDoc, linearGradient, grainFilter, vignette, frame, cursor, isMain, runCli } from './lib.mjs';
import { asciiField, asciiSvg } from './ascii.mjs';

export function generate(ctx) {
  const { palette: p, post } = ctx;
  const { groups, center } = asciiField(ctx, { cellW: 14, cellH: 22 });
  const vig = vignette('vig', 0.22);
  // snap the selection to the character grid so it lines up with the glyphs
  const bw = Math.round((center.r * 1.15) / 14) * 14;
  const bh = Math.round((center.r * 0.75) / 22) * 22;
  const bx = Math.max(56, Math.min(W - bw - 56, Math.round((center.x - bw / 2) / 14) * 14));
  const by = Math.max(44, Math.min(H - bh - 120, Math.round((center.y - bh / 2) / 22) * 22));
  const hs = 12;
  const handles = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]
    .map(([x, y]) => `<rect x="${x - hs / 2}" y="${y - hs / 2}" width="${hs}" height="${hs}" rx="2.5" fill="${p.bgB}" stroke="#fff" stroke-width="2"/>`)
    .join('');
  return svgDoc(
    linearGradient('bg', p.bgA, p.bgB, 120) + grainFilter() + vig.def,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     ${asciiSvg(groups, p.light, { fontSize: 18 })}
     ${vig.rect}
     <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#fff" fill-opacity="0.05" stroke="#fff" stroke-width="2"/>
     ${handles}
     ${cursor(bx + bw + 8, by + bh + 8, 2.1, '#fff', p.ink)}
     <rect width="${W}" height="${H}" filter="url(#grain)"/>
     ${frame(post)}`,
  );
}

if (isMain(import.meta.url)) runCli('ascii-canvas', generate);
