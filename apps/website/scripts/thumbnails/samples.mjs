// Renders every style for a few sample posts and writes a self-contained contact sheet.
//   node scripts/thumbnails/samples.mjs [outDir] [--styles dither,mesh,dither-mesh]
import fs from 'node:fs';
import path from 'node:path';
import { makeContext, renderPng } from './lib.mjs';
import * as ascii from './ascii.mjs';
import * as flowfield from './flowfield.mjs';
import * as canvasGrid from './canvas-grid.mjs';
import * as truchet from './truchet.mjs';
import * as contours from './contours.mjs';
import * as dither from './dither.mjs';
import * as mesh from './mesh.mjs';
import * as asciiCanvas from './ascii-canvas.mjs';
import { VARIANTS as ditherMesh } from './dither-mesh.mjs';

const STYLES = [
  ['ascii', '1 · ASCII noise field', ascii],
  ['flowfield', '2 · Flow-field scribbles', flowfield],
  ['canvas-grid', '3 · Infinite canvas motif', canvasGrid],
  ['truchet', '4 · Truchet tiles', truchet],
  ['contours', '5 · Topographic contours', contours],
  ['dither', '6 · Dithered gradient', dither],
  ['mesh', '7 · Mesh gradient + grain', mesh],
  ['ascii-canvas', '8 · ASCII + selection (combo)', asciiCanvas],
  ['dither-mesh', '9 · Dithered mesh (6 + 7)', { generate: ditherMesh['dither-mesh'] }],
  ['dither-mesh-fade', '10 · Mesh dissolving into dither (6 + 7)', { generate: ditherMesh['dither-mesh-fade'] }],
  ['dither-mesh-lens', '11 · Mesh with pixel lens selection (6 + 7)', { generate: ditherMesh['dither-mesh-lens'] }],
  ['dither-mesh-steps', '12 · Mesh in resolution steps (6 + 7)', { generate: ditherMesh['dither-mesh-steps'] }],
];

const POSTS = [
  { slug: 'introducing-kritzel', date: '2026-08-02', tags: ['release'] },
  { slug: 'building-a-whiteboard-in-react', date: '2026-09-14', tags: ['tutorial'] },
  { slug: 'how-the-renderer-handles-10k-objects', date: '2026-10-01', tags: ['engineering'] },
];

const args = process.argv.slice(2);
const stylesArg = args.indexOf('--styles');
const only = stylesArg >= 0 ? args.splice(stylesArg, 2)[1].split(',') : null;
const outDir = args[0] ?? path.join('build', 'thumbnail-samples');
fs.mkdirSync(outDir, { recursive: true });

let sections = '';
for (const [key, label, mod] of STYLES.filter(([k]) => !only || only.includes(k))) {
  let cells = '';
  for (const post of POSTS) {
    const file = path.join(outDir, `${key}--${post.slug}.png`);
    const t = performance.now();
    renderPng(mod.generate(makeContext(post)), file);
    const ms = Math.round(performance.now() - t);
    console.log(`${file} (${ms} ms)`);
    cells += `<figure><img src="${path.basename(file)}" loading="lazy"/><figcaption>${post.slug} · <i>${post.tags.join(', ')}</i></figcaption></figure>`;
  }
  sections += `<section><h2>${label}</h2><div class="row">${cells}</div><code>node scripts/thumbnails/${key}.mjs --slug my-post</code></section>`;
}

fs.writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Blog thumbnail samples</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;background:#f4f5f7;color:#1b1d22;margin:0;padding:32px}
  h1{margin:0 0 8px}p{color:#5b6070;margin:0 0 28px}
  section{margin-bottom:40px}h2{font-size:18px;margin:0 0 12px}
  .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
  figure{margin:0}img{width:100%;border-radius:10px;display:block;box-shadow:0 1px 3px rgba(0,0,0,.12)}
  figcaption{font-size:12px;color:#6b7080;margin-top:6px}
  code{display:inline-block;margin-top:8px;font-size:12px;color:#6b7080}
</style>
<h1>Blog thumbnail samples</h1>
<p>Each row is one style; columns are three sample posts. Seed = hash(slug), hue = tag (release / tutorial / engineering).</p>
${sections}`,
);
console.log(`contact sheet: ${path.join(outDir, 'index.html')}`);
