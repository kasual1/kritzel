// Checks the built blog (run after `npm run build`): every header video loads lazily with a poster, and every post
// page with a video describes it for search engines and social previews.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, type CheerioAPI } from 'cheerio';
import { describe, expect, test } from 'vitest';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const buildRoot = path.join(websiteRoot, 'build');
const blogRoot = path.join(buildRoot, 'blog');
const DEFAULT_SOCIAL_CARD = 'docusaurus-social-card.jpg';

function htmlFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return htmlFiles(full);
    }
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

const pages = htmlFiles(blogRoot).map((file) => ({ file: path.relative(buildRoot, file), $: load(fs.readFileSync(file, 'utf8')) }));
/** Blog post pages (not the list, tag or archive pages) that show a header video. */
const videoPostPages = pages.filter(({ $ }) => $('meta[property="og:type"]').attr('content') === 'article' && $('article video').length > 0);

function videoObjects($: CheerioAPI): Record<string, unknown>[] {
  return $('script[type="application/ld+json"]')
    .toArray()
    .flatMap((script) => {
      const data = JSON.parse($(script).text());
      return Array.isArray(data) ? data : [data];
    })
    .filter((data) => data?.['@type'] === 'VideoObject');
}

describe('built blog videos', () => {
  test('the blog was built (run `npm run build -w apps/website` first)', () => {
    expect(fs.existsSync(blogRoot)).toBe(true);
    expect(videoPostPages.length).toBeGreaterThan(0);
  });

  test.each(pages.filter(({ $ }) => $('video').length > 0).map((page) => [page.file, page] as const))(
    '%s: every video has a poster, a fixed size and plays muted inline',
    (_file, { $ }) => {
      $('video').each((_index, element) => {
        const video = $(element);
        expect(video.attr('poster'), `${video.attr('src')} needs a poster`).toMatch(/\.jpg$/);
        expect(Number(video.attr('width'))).toBeGreaterThan(0);
        expect(Number(video.attr('height'))).toBeGreaterThan(0);
        expect(video.attr('muted')).toBeDefined();
        expect(video.attr('playsinline')).toBeDefined();
        expect(['none', 'metadata']).toContain(video.attr('preload'));
      });
    },
  );

  test.each(pages.filter(({ $ }) => $('meta[property="og:type"]').attr('content') !== 'article' && $('video').length > 0).map((page) => [page.file, page] as const))(
    '%s: list pages load no video before it scrolls into view',
    (_file, { $ }) => {
      $('video').each((_index, element) => {
        expect($(element).attr('preload')).toBe('none');
        expect($(element).attr('autoplay')).toBeUndefined();
      });
    },
  );

  test.each(videoPostPages.map((page) => [page.file, page] as const))('%s: describes its video for search engines', (_file, { $ }) => {
    const video = $('article video').first();
    const src = video.attr('src') ?? '';
    const [data] = videoObjects($);
    expect(data, 'needs VideoObject structured data').toBeDefined();
    for (const key of ['name', 'description', 'thumbnailUrl', 'contentUrl', 'uploadDate', 'duration']) {
      expect(data[key], `VideoObject.${key}`).toBeTruthy();
    }
    expect(String(data.contentUrl)).toMatch(/^https?:\/\//);
    expect(String(data.contentUrl).endsWith(src)).toBe(true);
    expect(String(data.thumbnailUrl).endsWith(video.attr('poster') ?? '')).toBe(true);
    expect(String(data.duration)).toMatch(/^PT\d+(\.\d+)?S$/);

    expect($('meta[property="og:video"]').attr('content')).toBe(data.contentUrl);
    expect($(`link[rel="preload"][as="image"]`).attr('href')).toBe(video.attr('poster'));
    // A post with a video still needs its own social image instead of the site-wide default card.
    const ogImage = $('meta[property="og:image"]').attr('content') ?? '';
    expect(ogImage).toBeTruthy();
    expect(ogImage.endsWith(DEFAULT_SOCIAL_CARD), 'needs its own image, not the default social card').toBe(false);
  });
});
