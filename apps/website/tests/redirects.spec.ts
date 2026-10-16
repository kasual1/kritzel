import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface Redirect {
  from: string;
  to: string;
  status: string;
}

function readRedirects(): Redirect[] {
  const content = fs.readFileSync(path.join(websiteRoot, 'static', '_redirects'), 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return { from, to, status };
    });
}

// Resolves a site route to the source file Docusaurus builds it from, if any.
function routeSource(route: string): string | undefined {
  const trimmed = route.replace(/^\/|\/$/g, '');
  const candidates = trimmed.startsWith('docs/')
    ? [`${trimmed}.md`, `${trimmed}.mdx`]
    : ['tsx', 'md'].flatMap((ext) => [
        `src/pages/${trimmed || 'index'}.${ext}`,
        `src/pages/${trimmed}/index.${ext}`,
      ]);
  return candidates.find((candidate) => fs.existsSync(path.join(websiteRoot, candidate)));
}

describe('static/_redirects', () => {
  const redirects = readRedirects();

  test('every line is a permanent redirect', () => {
    expect(redirects.length).toBeGreaterThan(0);
    for (const redirect of redirects) {
      expect(redirect.status, redirect.from).toBe('301');
    }
  });

  test('every source is listed once', () => {
    const sources = redirects.map((redirect) => redirect.from);
    expect(sources.filter((source, index) => sources.indexOf(source) !== index)).toEqual([]);
  });

  test('every target is an existing route', () => {
    const missing = redirects
      .filter((redirect) => redirect.to !== '/blog/' && !routeSource(redirect.to))
      .map((redirect) => `${redirect.from} -> ${redirect.to}`);
    expect(missing).toEqual([]);
  });

  test('no source shadows an existing route', () => {
    const shadowed = redirects
      .filter((redirect) => routeSource(redirect.from))
      .map((redirect) => redirect.from);
    expect(shadowed).toEqual([]);
  });
});
