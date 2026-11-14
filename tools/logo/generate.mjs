// Generates every Updraw logo variant from a workspace export that holds the drawn mark.
// See README.md for what it writes and why.
//
//   npm run logo:generate -- <workspace-export.json> [--out <dir>]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

// Mark width as a fraction of the tile width. The light tile and the README badge keep the width the previous
// mark had; the dark tiles are narrower than before (0.80 / 0.89) because the triangle's base corners reach
// into the rounded corners, and at these widths it keeps the previous mark's margin to the rounded outline.
const SIZES = { light: 0.62, readme: 0.68, dark: 0.72, app: 0.78 };

// Optical centering: an upward triangle carries its weight low, so it's lifted by this fraction of its height.
const LIFT = 0.035;

// Below ~56 px the hand-drawn lines get thinner than a pixel, so the favicons and bare marks add a
// same-coloured outline of this many output pixels. SVGs do it with size media queries (they see the size the
// image is drawn at), the small rasters have it baked in. Nothing changes at 64 px and up.
const BOOST = [
  { max: 24, px: 0.4 },
  { max: 40, px: 0.35 },
  { max: 56, px: 0.25 },
];
const boostPx = (size) => (BOOST.find((b) => size <= b.max) ?? { px: 0 }).px;

const INK = '#000000';
const PAPER = '#ffffff';
const BORDER = '#ededed';

const PATHS_TS = 'apps/website/src/components/Landing/paths.ts';

// ---------- arguments ----------

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outRoot = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : ROOT;
const exportFile = args.find((a, i) => !a.startsWith('--') && !(outIndex >= 0 && i === outIndex + 1));
if (!exportFile) {
  console.error('usage: npm run logo:generate -- <workspace-export.json> [--out <dir>]');
  process.exit(1);
}

// ---------- the mark ----------

const fmt = (n) => {
  const s = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};

function readMark(file) {
  const workspace = JSON.parse(fs.readFileSync(file, 'utf8'));
  const paths = (workspace.objects ?? []).filter((o) => o.__class__ === 'KritzelPath');
  if (paths.length !== 1) {
    throw new Error(`${file}: expected exactly one drawn path (KritzelPath), found ${paths.length}. ` +
      'Export a workspace that holds only the logo, drawn as a single stroke.');
  }
  return paths[0].d;
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

function variants({ d, w, h }) {
  // <style> that thickens the mark when the image is drawn small (browser tabs, the 24 px docs navbar).
  // non-scaling-stroke makes stroke-width mean output pixels, so it matches the baked-in raster boost.
  // Widest band first so the narrower ones override it, without gaps at fractional sizes.
  const hint = (fg) =>
    `<style>.m{stroke:${fg};stroke-width:0;stroke-linejoin:round;vector-effect:non-scaling-stroke}` +
    [...BOOST].reverse().map((b) => `@media (max-width:${b.max}px){.m{stroke-width:${b.px}px}}`).join('') +
    '</style>';

  const bare = (fill, hinted = true) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    (hinted ? `${hint(fill)}<path class="m"` : '<path') + ` fill="${fill}" d="${d}"/></svg>\n`;

  // The mark in a `size` square, `frac` of its width wide, centred and lifted.
  const placed = (size, frac, fill, attrs = '') => {
    const k = (size * frac) / w;
    const tx = (size - w * k) / 2;
    const ty = (size - h * k) / 2 - LIFT * h * k;
    return `<path${attrs} fill="${fill}" transform="translate(${fmt(tx)} ${fmt(ty)}) scale(${+k.toFixed(5)})" d="${d}"/>`;
  };

  // `rasterSize` bakes the small-size boost in (for PNG/ICO frames); `hinted` adds the media-query version.
  const tile = ({ bg, fg, frac, rounded = true, hinted = false, rasterSize = 0 }) => {
    const units = (px) => fmt((px * w) / (rasterSize * frac)); // output px -> path units
    const attrs = rasterSize && boostPx(rasterSize)
      ? ` stroke="${fg}" stroke-width="${units(boostPx(rasterSize))}" stroke-linejoin="round"`
      : hinted ? ' class="m"' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">` +
      (hinted ? hint(fg) : '') +
      `<rect width="1000" height="1000"${rounded ? ' rx="350" ry="350"' : ''} fill="${bg}"/>` +
      placed(1000, frac, fg, attrs) +
      '</svg>\n';
  };

  // README badge: white tile with a light grey border, shown at 160 px on GitHub.
  const S = 1162.5;
  const readme =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
    `<rect x="9.38" y="9.38" width="1143.75" height="1143.75" rx="365.63" ry="365.63" fill="${PAPER}" stroke="${BORDER}" stroke-width="18.75"/>` +
    placed(S, SIZES.readme, INK) +
    '</svg>\n';

  const light = { bg: PAPER, fg: INK, frac: SIZES.light };
  const dark = { bg: INK, fg: PAPER, frac: SIZES.dark };
  const app = { bg: INK, fg: PAPER, frac: SIZES.app };

  return {
    svg: {
      'logo.svg': readme,
      'apps/website/static/img/logo.svg': bare(INK),
      'apps/website/static/img/logo_dark.svg': bare(PAPER),
      'apps/website/static/img/favicon.svg': tile({ ...light, hinted: true }),
      'apps/website/static/img/favicon_dark.svg': tile({ ...dark, hinted: true }),
      'apps/app/client/public/favicon.svg': tile({ ...app, hinted: true }),
    },
    // [file, svg for a given pixel size, width, height]
    png: [
      ['apps/website/static/img/logo.png', () => bare(INK, false), Math.round((277 * w) / h), 277],
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

// Puts the new path and viewBox into the constants the website's React components draw the mark from.
function updatePathsTs(file, { d, w, h }) {
  const source = fs.readFileSync(file, 'utf8');
  if (!/export const UPDRAW_LOGO_PATH =/.test(source) || !/export const UPDRAW_LOGO_VIEWBOX =/.test(source)) {
    throw new Error(`${file}: UPDRAW_LOGO_PATH / UPDRAW_LOGO_VIEWBOX not found`);
  }
  fs.writeFileSync(
    file,
    source
      .replace(/(export const UPDRAW_LOGO_PATH =\s*)"[^"]*";/, `$1"${d}";`)
      .replace(/(export const UPDRAW_LOGO_VIEWBOX = )"[^"]*";/, `$1"0 0 ${w} ${h}";`),
  );
}

// ---------- main ----------

let drawn;
try {
  drawn = readMark(exportFile);
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
  console.log(`mark: ${mark.w} x ${mark.h} (aspect ${(mark.w / mark.h).toFixed(4)})`);

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
    updatePathsTs(pathsTs, mark);
    console.log(`  ${PATHS_TS}`);
  } else console.log(`  (skipped ${PATHS_TS}: not in ${outRoot})`);

  console.log(
    '\nNext: run `npm run thumbnails` in apps/website so the blog thumbnails pick up the new logo (see README.md).',
  );
} finally {
  await browser.close();
}
