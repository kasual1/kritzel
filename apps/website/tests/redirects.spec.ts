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

// Resolves a site route to the file it is built or served from, if any: a doc, a blog post
// (blog/YYYY/MM/DD/<slug> comes from blog/YYYY-MM-DD-<slug>.md(x) or its <...>/index.md(x)),
// a static image or video, or a page.
function routeSource(route: string): string | undefined {
  const trimmed = route.replace(/^\/|\/$/g, '');
  const blogPost = trimmed.match(/^blog\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)$/);
  let candidates: string[];
  if (/^docs\/.+\.md$/.test(trimmed)) {
    // the Markdown export docusaurus-plugin-llms writes next to each doc page
    candidates = [trimmed, `${trimmed}x`];
  } else if (trimmed.startsWith('docs/')) {
    candidates = [`${trimmed}.md`, `${trimmed}.mdx`];
  } else if (blogPost) {
    const [, year, month, day, slug] = blogPost;
    const base = `blog/${year}-${month}-${day}-${slug}`;
    candidates = ['md', 'mdx'].flatMap((ext) => [`${base}.${ext}`, `${base}/index.${ext}`]);
  } else if (/^(img|videos)\//.test(trimmed)) {
    candidates = [`static/${trimmed}`];
  } else {
    candidates = ['tsx', 'md'].flatMap((ext) => [
      `src/pages/${trimmed || 'index'}.${ext}`,
      `src/pages/${trimmed}/index.${ext}`,
    ]);
  }
  return candidates.find((candidate) => fs.existsSync(path.join(websiteRoot, candidate)));
}

describe('routeSource', () => {
  test('resolves docs and pages', () => {
    expect(routeSource('/docs/react/getting-started/quick-start/')).toBe('docs/react/getting-started/quick-start.md');
    expect(routeSource('/license/')).toBe('src/pages/license.md');
    expect(routeSource('/')).toBe('src/pages/index.tsx');
  });

  test('resolves the Markdown export of a doc to the doc', () => {
    expect(routeSource('/docs/react/getting-started/quick-start.md')).toBe('docs/react/getting-started/quick-start.md');
    expect(routeSource('/docs/react/getting-started/no-such-page.md')).toBeUndefined();
  });

  test('resolves blog post routes to their markdown file', () => {
    expect(routeSource('/blog/2026/10/22/upmade-is-now-open-source/')).toBe(
      'blog/2026-10-22-upmade-is-now-open-source.md',
    );
    expect(routeSource('/blog/2026/08/02/introducing-upmade')).toBe('blog/2026-08-02-introducing-upmade.md');
    expect(routeSource('/blog/2026/10/23/upmade-is-now-open-source/')).toBeUndefined();
    expect(routeSource('/blog/2026/10/22/no-such-post/')).toBeUndefined();
  });

  test('resolves images and videos to static files', () => {
    expect(routeSource('/img/blog/upmade-is-now-open-source.png')).toBe(
      'static/img/blog/upmade-is-now-open-source.png',
    );
    expect(routeSource('/videos/2026_10_22_Upmade_Open_Source.mp4')).toBe(
      'static/videos/2026_10_22_Upmade_Open_Source.mp4',
    );
    expect(routeSource('/img/blog/no-such-image.png')).toBeUndefined();
    expect(routeSource('/videos/no-such-video.mp4')).toBeUndefined();
  });
});

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

  test('no target is redirected again', () => {
    const withoutSlash = (route: string) => route.replace(/\/$/, '');
    const sources = new Set(redirects.map((redirect) => withoutSlash(redirect.from)));
    const chained = redirects
      .filter((redirect) => sources.has(withoutSlash(redirect.to)))
      .map((redirect) => `${redirect.from} -> ${redirect.to}`);
    expect(chained).toEqual([]);
  });

  // Kritzel was renamed to Updraw and Updraw to Upmade; links to both earlier names are out there.
  test('renamed blog posts and media are redirected from their Kritzel and Updraw names', () => {
    // Docs are left out: the migration guide was first published under the Updraw name.
    const renamed = redirects.filter((redirect) => /upmade/i.test(redirect.to) && !redirect.to.startsWith('/docs/'));
    expect(renamed.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const to of new Set(renamed.map((redirect) => redirect.to))) {
      for (const brand of ['Kritzel', 'Updraw']) {
        const legacy = to.replace(/upmade/g, brand.toLowerCase()).replace(/Upmade/g, brand);
        for (const from of legacy.endsWith('/') ? [legacy, legacy.slice(0, -1)] : [legacy]) {
          if (!redirects.some((redirect) => redirect.from === from && redirect.to === to)) {
            missing.push(`${from} -> ${to}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('renamed documentation pages', () => {
  const redirects = readRedirects();

  // Pages are matched with and without a trailing slash, so links in either form get the 301.
  test('every page source is listed with and without a trailing slash', () => {
    const sources = new Set(redirects.map((redirect) => redirect.from));
    const missing = redirects
      .filter((redirect) => !/\.\w+$/.test(redirect.from))
      .map((redirect) => (redirect.from.endsWith('/') ? redirect.from.slice(0, -1) : `${redirect.from}/`))
      .filter((variant) => !sources.has(variant));
    expect(missing).toEqual([]);
  });

  test('the quick start keeps its flat URL', () => {
    expect(redirects).toContainEqual({
      from: '/docs/react/quick-start',
      to: '/docs/react/getting-started/quick-start/',
      status: '301',
    });
  });
});
