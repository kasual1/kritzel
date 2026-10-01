import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';

const buildRoot = new URL('../build/', import.meta.url);
const baseUrl = `/${(process.env.Docusaurus_BASE_URL || '/').split('/').filter(Boolean).join('/')}/`.replace('//', '/');
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkStringify);
const indexPath = new URL('llms.txt', buildRoot);
const index = await readFile(indexPath, 'utf8');
if (!index.startsWith('# Kritzel\n')) throw new Error('Missing or invalid generated llms.txt');

function visit(node, visitor) {
  for (const child of node.children ?? []) visit(child, visitor);
  visitor(node);
}

const pages = new Set();
visit(parser.parse(index), (node) => {
  if (node.type !== 'link') return;
  const url = new URL(node.url);
  if (url.origin !== 'https://kritzel.io' || !url.pathname.endsWith('.md')) return;
  if (!url.pathname.startsWith(baseUrl)) throw new Error(`Missing base URL: ${url.href}`);
  const relativePath = url.pathname.slice(baseUrl.length);
  const output = new URL(relativePath, buildRoot);
  if (!output.href.startsWith(buildRoot.href)) throw new Error(`Path outside build: ${url.href}`);
  pages.add(output.href);
});
if (pages.size === 0) throw new Error('No Markdown pages found in llms.txt');

let updated = 0;
for (const page of pages) {
  const filePath = fileURLToPath(page);
  const content = await readFile(filePath, 'utf8');
  if (baseUrl === '/') continue;
  const tree = parser.parse(content);
  const patches = [];
  visit(tree, (node) => {
    if (!['link', 'image', 'definition'].includes(node.type)) return;
    if (!node.url.startsWith('/') || node.url.startsWith('//') || node.url.startsWith(baseUrl)) return;
    node.url = `${baseUrl.slice(0, -1)}${node.url}`;
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) throw new Error(`Missing link position in ${page}`);
    patches.push({ start, end, text: parser.stringify({ type: 'root', children: [node] }).trimEnd() });
  });
  if (patches.length > 0) {
    const outermost = patches.filter((patch) => !patches.some((other) => other !== patch && other.start <= patch.start && other.end >= patch.end));
    let normalized = content;
    for (const patch of outermost.sort((first, second) => second.start - first.start)) {
      normalized = normalized.slice(0, patch.start) + patch.text + normalized.slice(patch.end);
    }
    await writeFile(filePath, normalized);
    updated += 1;
  }
}
console.log(`[llms] Verified ${pages.size} Markdown exports; normalized links in ${updated} pages for ${baseUrl}`);