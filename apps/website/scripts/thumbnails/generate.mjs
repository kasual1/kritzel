// Generates the blog thumbnails, or renders a single seed.
//
//   npm run thumbnails                     # posts whose thumbnail is missing or was made from another seed
//   npm run thumbnails -- --force          # regenerate all of them
//   npm run thumbnails -- --slug my-post   # only this post (combine with --force to redo it)
//   npm run thumbnails -- --seed 5b1192ef [--scale 4] [--out file.png]   # one seed, e.g. in high res
//   npm run thumbnails -- --seed "hello kritzel"                         # any text works as a seed
//   npm run thumbnails -- --seed random [--scale 2]                      # a fresh random seed
//   npm run thumbnails -- --seed 5b1192ef --logo-mask dim                # experiment: artwork inside the logo
//                                                     (backgrounds: white, dark, dim, transparent or a color)
//
// Every image is fully determined by its seed, an arbitrary string of up to 32 characters (see painting.mjs).
// For each post in blog/ (`*.md(x)` or `<dir>/index.md(x)`) the seed comes from `thumbnailSeed` in the front
// matter; posts without one get a stable seed from their slug, which is written back.
// The image goes to static/img/blog/<slug>.png and `image: /img/blog/<slug>.png` is added to the front
// matter (Docusaurus uses it as og:image). Posts whose `image` points somewhere else are left alone.
// Each PNG stores its seed, so changing `thumbnailSeed` re-renders the image on the next run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSeed, randomSeed, seedFor } from './painting.mjs';
import { readSeed, renderLogoMask, renderThumbnail } from './render.mjs';

const SITE_DIR = fileURLToPath(new URL('../../', import.meta.url));
const BLOG_DIR = path.join(SITE_DIR, 'blog');
const OUT_DIR = path.join(SITE_DIR, 'static', 'img', 'blog');
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})-/;

function findPosts(dir) {
  const posts = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) posts.push({ file: full, name: entry.name.replace(/\.mdx?$/, '') });
    else if (entry.isDirectory()) {
      const index = ['index.md', 'index.mdx'].map((f) => path.join(full, f)).find((f) => fs.existsSync(f));
      if (index) posts.push({ file: index, name: entry.name });
    }
  }
  return posts;
}

// Minimal front matter reader: top-level `key: value` pairs plus `tags` as an inline `[a, b]` or block list.
export function parseFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  let listKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    listKey = null;
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map((v) => unquote(v.trim())).filter(Boolean);
    } else data[key] = unquote(value);
  }
  return { data, end: match[0].length };
}

const unquote = (v) => v.replace(/^(['"])(.*)\1$/, '$2');

// Appends `key: value` lines at the end of the front matter, keeping the file's line endings.
function addFields(source, fields) {
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = Object.entries(fields).map(([k, v]) => `${eol}${k}: ${v}`).join('');
  return lines ? source.replace(/^(---\r?\n[\s\S]*?)(\r?\n---)/, `$1${lines}$2`) : source;
}

function slugOf(post, data) {
  if (data.slug) return data.slug.replace(/^\/+|\/+$/g, '').split('/').pop();
  return post.name.replace(DATE_PREFIX, '');
}

function option(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

const args = process.argv.slice(2);
const timed = (label, fn) => {
  const started = performance.now();
  fn();
  console.log(`${label} (${Math.round(performance.now() - started)} ms)`);
};

const seedArg = option('--seed');
if (seedArg) {
  // single image mode
  const seed = seedArg === 'random' ? randomSeed() : parseSeed(seedArg).text;
  const scale = Number(option('--scale') ?? 1);
  const name = seed.replace(/[^\w-]+/g, '_');
  const out = path.resolve(option('--out') ?? `thumbnail-${name}${scale > 1 ? `@${scale}x` : ''}.png`);
  const background = option('--logo-mask');
  timed(`thumbnail ${out}`, () =>
    background ? renderLogoMask(seed, out, { scale, background }) : renderThumbnail(seed, out, { scale }),
  );
  process.exit(0);
}

const force = args.includes('--force');
const only = option('--slug');
let generated = 0;
for (const post of findPosts(BLOG_DIR)) {
  const rel = path.relative(SITE_DIR, post.file);
  const source = fs.readFileSync(post.file, 'utf8');
  const fm = parseFrontMatter(source);
  if (!fm) {
    console.warn(`skip ${rel}: no front matter`);
    continue;
  }
  const slug = slugOf(post, fm.data);
  if (only && slug !== only) continue;
  const url = `/img/blog/${slug}.png`;
  if (fm.data.image && fm.data.image !== url) continue; // custom image, not ours

  let seed;
  try {
    seed = fm.data.thumbnailSeed ? parseSeed(fm.data.thumbnailSeed).text : seedFor(slug);
  } catch (error) {
    throw new Error(`${rel}: ${error.message}`);
  }
  const out = path.join(OUT_DIR, `${slug}.png`);
  if (force || readSeed(out) !== seed) {
    timed(`thumbnail ${path.relative(SITE_DIR, out)} from ${seed}`, () => renderThumbnail(seed, out));
    generated++;
  }
  const missing = {};
  if (!fm.data.thumbnailSeed) missing.thumbnailSeed = JSON.stringify(seed); // quoted: YAML would read 12345678 as a number
  if (!fm.data.image) missing.image = url;
  if (Object.keys(missing).length) fs.writeFileSync(post.file, addFields(source, missing));
}
console.log(generated ? `generated ${generated} blog thumbnail(s)` : 'blog thumbnails up to date');
