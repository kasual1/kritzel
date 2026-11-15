// Generates every Updraw logo variant from the mark: by default tools/logo/source/updraw-mark.svg, or an Updraw
// workspace export that holds the mark drawn as a single stroke. See README.md for what it writes and why.
//
//   npm run logo:generate -- [<mark.svg | workspace-export.json>] [--out <dir>] [--weight <units>] [--size <factor>]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SOURCE = 'tools/logo/source/updraw-mark.svg';

// The mark's larger side (its height, for the current mark) as a fraction of the tile. The light and dark tiles hold
// the mark at the same size; the app's tab icon is a bit bigger so it reads in a browser tab.
const SIZES = { light: 0.66, dark: 0.66, app: 0.72 };

// Extra line weight: a same-coloured outline of this many path units around every stroke of the mark, in every
// variant. The current mark is drawn at its final weight already, so it's 0. `--weight` overrides it and `--size`
// scales SIZES, e.g. to preview a variant into `--out` first.
const WEIGHT = 0;

// The README badge (repo-root logo.svg, shown in the main README): the mark at this size in a white tile with a light
// grey border, the same size as in the light tile. null would leave the committed badge as it is.
const README_BADGE = { frac: SIZES.light };

// Optical centering: the mark is lifted by this fraction of its height inside the tiles.
const LIFT = 0;

// In a favicon the mark is only about 10-35 px tall: at 16 px its lines are under a pixel and at 24-48 px only
// 1-2.5 px. The tiles therefore widen the strokes by this many output pixels at 56 px and below to keep them crisp. SVGs do it with size media queries (they
// see the size the image is drawn at), the small rasters have it baked in. Nothing changes at 64 px and up. The bare
// mark doesn't need it: at its smallest use (24 px) it stays identical to the inline mark on the website.
// `at` is the typical size in each band, used to convert a tile's extra weight to output pixels.
const BOOST = [
  { max: 24, at: 16, px: 0.4 },
  { max: 40, at: 32, px: 0.35 },
  { max: 56, at: 48, px: 0.25 },
];
const boostPx = (size) => (BOOST.find((b) => size <= b.max) ?? { px: 0 }).px;

const INK = '#000000';
const PAPER = '#ffffff';
const BORDER = '#ededed';

const PATHS_TS = 'apps/website/src/components/Landing/paths.ts';

// ---------- arguments ----------

const USAGE = 'usage: npm run logo:generate -- [<mark.svg | workspace-export.json>] [--out <dir>] [--weight <units>] [--size <factor>]';
const args = process.argv.slice(2);
const OPTIONS = ['--out', '--weight', '--size'];
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const optionValues = new Set(OPTIONS.map((o) => args.indexOf(o)).filter((i) => i >= 0).map((i) => i + 1));
const sourceFile = args.find((a, i) => !a.startsWith('--') && !optionValues.has(i)) ?? path.join(ROOT, SOURCE);
const outRoot = option('--out') ? path.resolve(option('--out')) : ROOT;
const weight = Number(option('--weight') ?? WEIGHT);
const sizeFactor = Number(option('--size') ?? 1);
if (!(weight >= 0) || !(sizeFactor > 0)) {
  console.error(USAGE);
  process.exit(1);
}

// ---------- the mark ----------

const fmt = (n) => {
  const s = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};

// The mark's path data. An SVG contributes every <path d> as filled (nonzero) outlines in one coordinate space; the
// tool refuses what it can't reproduce faithfully (transforms, nested <svg>, other shapes, unfilled or even-odd
// paths) instead of silently drawing a different mark. An Updraw workspace export must hold exactly one drawn path.
function readMark(file) {
  const text = fs.readFileSync(file, 'utf8');
  let d;
  if (/\.svg$/i.test(file)) {
    const fail = (why) => {
      throw new Error(`${file}: ${why}. The mark must be filled <path d> elements in one coordinate space, using ` +
        'absolute M L Q T C S Z commands (flatten other SVGs first, e.g. in a vector editor).');
    };
    const inner = text.replace(/^[\s\S]*?<svg\b[^>]*>/, ''); // everything inside the outer <svg>
    if (/<svg\b/.test(inner)) fail('nested <svg> elements are not supported');
    if (/\stransform\s*=/.test(text)) fail('transform attributes are not supported');
    if (/<(rect|circle|ellipse|line|polyline|polygon|use|image|text)\b/.test(inner)) fail('only <path> elements are supported');
    if (/fill\s*[:=]\s*["']?\s*none/.test(text)) fail('unfilled (stroke-only) paths are not supported');
    if (/evenodd/.test(text)) fail('fill-rule evenodd is not supported');
    const paths = [...text.matchAll(/<path\b[^>]*?\sd\s*=\s*(["'])([\s\S]*?)\1/g)].map((m) => m[2].trim());
    if (!paths.length) fail('no <path d="..."> found');
    d = paths.join(' ');
  } else {
    let workspace;
    try {
      workspace = JSON.parse(text);
    } catch {
      throw new Error(`${file}: neither an .svg file nor valid JSON (an Updraw workspace export)`);
    }
    const paths = (workspace.objects ?? []).filter((o) => o.__class__ === 'KritzelPath');
    if (paths.length !== 1) {
      throw new Error(`${file}: expected exactly one drawn path (KritzelPath), found ${paths.length}. ` +
        'Export a workspace that holds only the logo, drawn as a single stroke, or pass the mark as an SVG.');
    }
    d = paths[0].d;
  }
  try {
    translatePath(d, 0, 0); // validates the commands and coordinates up front
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
  return d;
}

// Moves every coordinate of an absolute path by (dx, dy). Updraw exports filled outlines as M/Q/T/Z.
function translatePath(d, dx, dy) {
  const tokens = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g);
  const parts = [];
  let pair = [];
  for (const t of tokens) {
    if (/[A-Za-z]/.test(t)) {
      if (!'MLQTCSZ'.includes(t)) throw new Error(`unsupported path command "${t}" (only absolute M L Q T C S Z)`);
      if (pair.length) throw new Error('path has a dangling coordinate');
      parts.push(t);
    } else if (pair.push(Number(t)) === 2) {
      parts.push(`${fmt(pair[0] + dx)},${fmt(pair[1] + dy)}`);
      pair = [];
    }
  }
  if (pair.length) throw new Error('path has an odd number of coordinates');
  return parts.join(' ').replace(/([MLQTCSZ]) /g, '$1').trim();
}

// ---------- SVG builders ----------

// The bare mark: the drawing moved by half the outline so the outline fits in a box starting at 0,0.
function bareMark({ d, w, h }) {
  return { d: weight ? translatePath(d, weight / 2, weight / 2) : d, w: Number(fmt(w + weight)), h: Number(fmt(h + weight)) };
}

function variants({ d, w, h }) {
  const s = weight;
  const outline = (fg) => (s ? ` stroke="${fg}" stroke-width="${fmt(s)}" stroke-linejoin="round"` : '');
  // <style> that thickens the tile icons' mark when the image is drawn small (browser tabs, bookmarks).
  // non-scaling-stroke makes stroke-width mean output pixels, so it matches the baked-in raster boost.
  // Widest band first so the narrower ones override it, without gaps at fractional sizes.
  // `extraPx(at)` is a tile's own extra weight in output pixels at that size: when the mark already has an outline,
  // the small-size rules replace it with a non-scaling one of the combined weight.
  const hint = (fg, extraPx = null) =>
    extraPx
      ? `<style>.m{stroke:${fg};stroke-linejoin:round}` +
        [...BOOST].reverse()
          .map((b) => `@media (max-width:${b.max}px){.m{stroke-width:${fmt(extraPx(b.at) + b.px)}px;vector-effect:non-scaling-stroke}}`)
          .join('') +
        '</style>'
      : `<style>.m{stroke:${fg};stroke-width:0;stroke-linejoin:round;vector-effect:non-scaling-stroke}` +
        [...BOOST].reverse().map((b) => `@media (max-width:${b.max}px){.m{stroke-width:${b.px}px}}`).join('') +
        '</style>';

  const b = bareMark({ d, w, h });
  const bare = (fill) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${b.w}" height="${b.h}" viewBox="0 0 ${b.w} ${b.h}">` +
    `<path${outline(fill)} fill="${fill}" d="${b.d}"/></svg>\n`;

  // The mark in a `size` square, its larger side `frac` of the tile, centred and lifted. With an outline of `s` path
  // units the mark is that much bigger, so its outer edge is what gets `frac` of the tile.
  const side = (s) => Math.max(w + s, h + s);
  const placed = (size, frac, fill, attrs = '', s = 0) => {
    const k = (size * frac) / side(s);
    const tx = (size - (w + s) * k) / 2 + (s / 2) * k;
    const ty = (size - (h + s) * k) / 2 - LIFT * (h + s) * k + (s / 2) * k;
    return `<path${attrs} fill="${fill}" transform="translate(${fmt(tx)} ${fmt(ty)}) scale(${+k.toFixed(5)})" d="${d}"/>`;
  };

  // Light, dark and app tiles. `rasterSize` bakes the small-size boost in (for PNG/ICO frames); `hinted` adds
  // the media-query version.
  const tile = ({ bg, fg, frac: baseFrac, rounded = true, hinted = false, rasterSize = 0 }) => {
    const frac = baseFrac * sizeFactor;
    const unitsPerPx = (px) => side(s) / (px * frac); // path units per output px at that size
    const extraPx = (px) => s / unitsPerPx(px);
    let attrs = '';
    if (rasterSize) {
      const total = s + (boostPx(rasterSize) ? boostPx(rasterSize) * unitsPerPx(rasterSize) : 0);
      if (total) attrs = ` stroke="${fg}" stroke-width="${fmt(total)}" stroke-linejoin="round"`;
    } else if (hinted) {
      attrs = ` class="m"${outline(fg)}`;
    } else {
      attrs = outline(fg);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">` +
      (hinted ? hint(fg, s ? extraPx : null) : '') +
      `<rect width="1000" height="1000"${rounded ? ' rx="350" ry="350"' : ''} fill="${bg}"/>` +
      placed(1000, frac, fg, attrs, s) +
      '</svg>\n';
  };

  // README badge: white tile with a light grey border, shown at 160 px on GitHub (see README_BADGE).
  const S = 1162.5;
  const readme = README_BADGE &&
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
    `<rect x="9.38" y="9.38" width="1143.75" height="1143.75" rx="365.63" ry="365.63" fill="${PAPER}" stroke="${BORDER}" stroke-width="18.75"/>` +
    placed(S, README_BADGE.frac, INK, outline(INK), s) +
    '</svg>\n';

  const light = { bg: PAPER, fg: INK, frac: SIZES.light };
  const dark = { bg: INK, fg: PAPER, frac: SIZES.dark };
  const app = { bg: INK, fg: PAPER, frac: SIZES.app };

  return {
    svg: {
      ...(readme ? { 'logo.svg': readme } : {}),
      'apps/website/static/img/logo.svg': bare(INK),
      'apps/website/static/img/logo_dark.svg': bare(PAPER),
      'apps/website/static/img/favicon.svg': tile({ ...light, hinted: true }),
      'apps/website/static/img/favicon_dark.svg': tile({ ...dark, hinted: true }),
      'apps/app/client/public/favicon.svg': tile({ ...app, hinted: true }),
    },
    // [file, svg for a given pixel size, width, height]
    png: [
      ['apps/website/static/img/logo.png', () => bare(INK), Math.round((277 * b.w) / b.h), 277],
      ['apps/website/static/img/logo_avatar.png', () => tile({ ...light, rounded: false }), 512, 512],
      ['apps/app/client/public/apple-touch-icon.png', (s) => tile({ ...dark, rasterSize: s }), 180, 180],
      ['apps/app/client/public/favicon-96x96.png', (s) => tile({ ...dark, rasterSize: s }), 96, 96],
      ['apps/app/client/public/web-app-manifest-192x192.png', (s) => tile({ ...dark, rasterSize: s }), 192, 192],
      ['apps/app/client/public/web-app-manifest-512x512.png', (s) => tile({ ...dark, rasterSize: s }), 512, 512],
    ],
    ico: [
      ['apps/website/static/favicon.ico', (s) => tile({ ...light, rasterSize: s }), [16, 32, 48, 64]],
      ['apps/app/client/public/favicon.ico', (s) => tile({ ...app, rasterSize: s }), [16, 32, 48]],
    ],
  };
}

// ICO whose frames are PNG-encoded (smaller than BMP frames, and what every current browser reads).
function encodeIco(frames) {
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...frames.map((f) => f.png)]);
}

// Puts the bare mark's path, viewBox and outline width into the constants the website's React components draw
// the mark from.
function updatePathsTs(file, { d, w, h }) {
  const source = fs.readFileSync(file, 'utf8');
  const names = ['UPDRAW_LOGO_PATH', 'UPDRAW_LOGO_VIEWBOX', 'UPDRAW_LOGO_STROKE_WIDTH'];
  const missing = names.filter((n) => !new RegExp(`export const ${n} =`).test(source));
  if (missing.length) throw new Error(`${file}: ${missing.join(', ')} not found`);
  fs.writeFileSync(
    file,
    source
      .replace(/(export const UPDRAW_LOGO_PATH =\s*)"[^"]*";/, `$1"${d}";`)
      .replace(/(export const UPDRAW_LOGO_VIEWBOX = )"[^"]*";/, `$1"0 0 ${w} ${h}";`)
      .replace(/(export const UPDRAW_LOGO_STROKE_WIDTH = )[\d.]+;/, `$1${fmt(weight)};`),
  );
}

// ---------- main ----------

let drawn;
try {
  drawn = readMark(sourceFile);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  const bbox = async (d) => {
    await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path id="p" d="${d}"/></svg>`);
    return page.evaluate(() => {
      const b = document.getElementById('p').getBBox();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    });
  };

  const raw = await bbox(drawn);
  const d = translatePath(drawn, -raw.x, -raw.y);
  const moved = await bbox(d);
  const mark = { d, w: Number(fmt(moved.x + moved.width)), h: Number(fmt(moved.y + moved.height)) };
  console.log(`mark: ${mark.w} x ${mark.h}, outline ${fmt(weight)} units, tile sizes x${sizeFactor}`);

  const write = (rel, data) => {
    const file = path.join(outRoot, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
    console.log(`  ${rel}`);
  };

  const render = async (svg, width, height) => {
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<body style="margin:0;background:transparent"><img style="display:block;width:${width}px;height:${height}px" ` +
        `src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body>`,
    );
    await page.evaluate(() => document.querySelector('img').decode());
    return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } });
  };

  const out = variants(mark);
  for (const [rel, svg] of Object.entries(out.svg)) write(rel, svg);
  for (const [rel, svgFor, width, height] of out.png) write(rel, await render(svgFor(width), width, height));
  for (const [rel, svgFor, sizes] of out.ico) {
    const frames = [];
    for (const size of sizes) frames.push({ size, png: await render(svgFor(size), size, size) });
    write(rel, encodeIco(frames));
  }

  const pathsTs = path.join(outRoot, PATHS_TS);
  if (fs.existsSync(pathsTs)) {
    updatePathsTs(pathsTs, bareMark(mark));
    console.log(`  ${PATHS_TS}`);
  } else console.log(`  (skipped ${PATHS_TS}: not in ${outRoot})`);

  console.log(
    '\nNext: run `npm run thumbnails` in apps/website so the blog thumbnails pick up the new logo (see README.md).',
  );
} finally {
  await browser.close();
}
