import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { load } from 'cheerio';
import { describe, expect, test } from 'vitest';

interface MarkdownNode {
  type: string;
  value?: string;
  url?: string;
  depth?: number;
  lang?: string | null;
  meta?: string | null;
  children?: MarkdownNode[];
}

interface DocumentMetadata {
  source: string;
  permalink: string;
  draft: boolean;
  unlisted: boolean;
}

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const buildRoot = path.join(websiteRoot, 'build');
const siteOrigin = 'https://kritzel.io';
const baseUrl = `/${(process.env.Docusaurus_BASE_URL || '/').split('/').filter(Boolean).join('/')}/`.replace('//', '/');
const frameworks = ['angular', 'react', 'vue'] as const;
const parser = unified().use(remarkParse).use(remarkGfm);

function nodes(markdown: string): MarkdownNode[] {
  function flatten(node: MarkdownNode): MarkdownNode[] {
    return [node, ...(node.children ?? []).flatMap(flatten)];
  }
  return flatten(parser.parse(markdown));
}

function readOutput(relativePath: string): string {
  const filePath = path.join(buildRoot, relativePath);
  expect(fs.existsSync(filePath), `Missing ${relativePath}; run the website production build first`).toBe(true);
  const content = fs.readFileSync(filePath, 'utf8').replaceAll('\r\n', '\n');
  expect(content.trim(), `Empty output: ${relativePath}`).not.toBe('');
  return content;
}

function outputPath(url: URL): string {
  expect(url.origin).toBe(siteOrigin);
  expect(url.pathname.startsWith(baseUrl), `Missing base URL in ${url.href}`).toBe(true);
  const relativePath = decodeURIComponent(url.pathname.slice(baseUrl.length));
  const resolvedPath = path.resolve(buildRoot, relativePath);
  expect(resolvedPath.startsWith(`${buildRoot}${path.sep}`), `Path outside build: ${url.href}`).toBe(true);
  return relativePath;
}

function documents(framework: string): DocumentMetadata[] {
  const directory = path.join(websiteRoot, '.docusaurus/docusaurus-plugin-content-docs', framework);
  return fs.readdirSync(directory)
    .filter((filename) => filename.startsWith('site-docs-') && filename.endsWith('.json'))
    .map((filename) => JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8')) as DocumentMetadata)
    .filter((document) => !document.draft && !document.unlisted);
}

function markdownUrl(document: DocumentMetadata): URL {
  return new URL(`${document.permalink.replace(/\/$/, '')}.md`, siteOrigin);
}

function codeBlocks(markdown: string) {
  return nodes(markdown).filter((node) => node.type === 'code')
    .map(({ lang, meta, value }) => ({ lang, meta, value }));
}

describe('Generated LLM documentation', () => {
  test('publishes integration guidance and one section per framework, without a combined bundle', () => {
    const index = readOutput('llms.txt');
    expect(index).toMatch(/^# Kritzel\n\n> /);
    for (const guidance of ['isReady', 'isEngineReady', 'syncConfig', 'editorId', 'TypeScript types', 'npx skills add kritzeljs/kritzel']) {
      expect(index).toContain(guidance);
    }
    const headings = nodes(index).filter((node) => node.type === 'heading' && node.depth === 2);
    expect(headings.map((heading) => heading.children?.map((child) => child.value ?? '').join('')))
      .toEqual(['Angular', 'React', 'Vue']);
    expect(fs.existsSync(path.join(buildRoot, 'llms-full.txt'))).toBe(false);
    expect(index).not.toMatch(/localhost|127\.0\.0\.1|kritzel-private|\.github\/skills/);
  });

  test('indexes every public document exactly once with an existing Markdown target', () => {
    const links = nodes(readOutput('llms.txt')).filter((node) => node.type === 'link').map((node) => node.url!)
      .filter((url) => new URL(url).origin === siteOrigin);
    const expected = frameworks.flatMap(documents).map((document) => markdownUrl(document).href);
    expect(expected.length).toBeGreaterThan(0);
    expect([...links].sort()).toEqual([...expected].sort());
    expect(new Set(links).size).toBe(links.length);
    for (const link of links) {
      const url = new URL(link);
      expect(url.pathname).toMatch(/\.md$/);
      expect(url.pathname).not.toMatch(/-\d+\.md$/);
      expect(readOutput(outputPath(url))).toMatch(/^# /);
    }
    for (const framework of frameworks) {
      const frameworkLinks = links.filter((link) => new URL(link).pathname.startsWith(`${baseUrl}docs/${framework}/`));
      expect(frameworkLinks.slice(0, 2)).toEqual([
        `${siteOrigin}${baseUrl}docs/${framework}/getting-started/quick-start.md`,
        `${siteOrigin}${baseUrl}docs/${framework}/getting-started/basic-usage.md`,
      ]);
    }
  });

  test.each(frameworks)('preserves %s source examples, inline code, and LiveDemo metadata', (framework) => {
    const metadata = documents(framework);
    expect(metadata.length).toBeGreaterThan(0);
    for (const document of metadata) {
      expect(document.source.startsWith(`@site/docs/${framework}/`)).toBe(true);
      const source = fs.readFileSync(path.join(websiteRoot, document.source.replace('@site/', '')), 'utf8').replaceAll('\r\n', '\n');
      const output = readOutput(outputPath(markdownUrl(document)));
      expect(codeBlocks(output), document.source).toEqual(codeBlocks(source));
      const inlineCode = (markdown: string) => nodes(markdown).filter((node) => node.type === 'inlineCode').map((node) => node.value);
      expect(inlineCode(output), document.source).toEqual(inlineCode(source));
      expect(output).not.toContain("import LiveDemo from '@site/src/components/LiveDemo'");
      for (const demo of source.matchAll(/<LiveDemo\b[\s\S]*?\/>/g)) {
        expect(output, document.source).toContain(demo[0]);
      }
    }
    const quickStart = readOutput(`docs/${framework}/getting-started/quick-start.md`);
    expect(quickStart).toContain(`@kritzel/${framework}-editor`);
    expect(quickStart).toContain(`https://github.com/kritzeljs/kritzel/tree/main/apps/demos/${framework}`);
    for (const other of frameworks.filter((candidate) => candidate !== framework)) {
      expect(quickStart).not.toContain(`@kritzel/${other}-editor`);
    }
  });

  test.each(frameworks)('resolves %s Markdown links and image targets to build artifacts', (framework) => {
    const missing: string[] = [];
    for (const document of documents(framework)) {
      const pageUrl = markdownUrl(document);
      const output = readOutput(outputPath(pageUrl));
      for (const node of nodes(output)) {
        if (!['link', 'image', 'definition'].includes(node.type) || !node.url || node.url.startsWith('#')) continue;
        const target = new URL(node.url, pageUrl);
        if (target.origin !== siteOrigin) {
          expect(['https:', 'http:', 'mailto:']).toContain(target.protocol);
          continue;
        }
        const relativePath = outputPath(target);
        const candidates = [relativePath, path.join(relativePath, 'index.html'), `${relativePath}.html`];
        if (!candidates.some((candidate) => fs.existsSync(path.join(buildRoot, candidate)) && fs.statSync(path.join(buildRoot, candidate)).isFile())) {
          missing.push(`${pageUrl.pathname} -> ${node.url}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test.each(frameworks)('keeps %s human pages and advertises the base-aware index', (framework) => {
    const html = readOutput(`docs/${framework}/getting-started/quick-start/index.html`);
    const discovery = load(html)('head link[rel="describedby"]');
    expect(discovery).toHaveLength(1);
    expect(discovery.attr('href')).toBe(`${siteOrigin}${baseUrl}llms.txt`);
  });
});