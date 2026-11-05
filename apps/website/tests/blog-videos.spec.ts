// Every blog video must be web-ready before it is committed: small, H.264, no audio, +faststart, with a poster and
// an up-to-date manifest entry. Run `npm run videos:optimize` at the repository root to fix whatever fails here.
// These checks read the MP4 files directly (tools/blog-videos/mp4.mjs), so they need no ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { inspectMp4 } from '../../../tools/blog-videos/mp4.mjs';
import { MANIFEST_FILE, VIDEO_DIR, WEBSITE_DIR, findIssues, sha256, videoUrl } from '../../../tools/blog-videos/rules.mjs';

interface ManifestEntry {
  poster: string;
  posterTime: number;
  width: number;
  height: number;
  duration: number;
  sha256: string;
}

const FIX = 'Run `npm run videos:optimize` at the repository root.';
/** Posters are JPEG frames at the video's size; a 1280×720 screen recording frame stays well below this. */
const MAX_POSTER_BYTES = 200 * 1024;

const BLOG_DIR = path.join(WEBSITE_DIR, 'blog');
const STATIC_DIR = path.join(WEBSITE_DIR, 'static');
const videos = fs.existsSync(VIDEO_DIR) ? fs.readdirSync(VIDEO_DIR).filter((name) => name.endsWith('.mp4')).sort() : [];
const manifest: Record<string, ManifestEntry> = fs.existsSync(MANIFEST_FILE) ? JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8')) : {};

/** Top-level `key: value` pairs of a Markdown file's front matter, or null without one. */
function frontMatter(file: string): Record<string, string> | null {
  const match = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (pair) {
      data[pair[1]] = pair[2].trim().replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return data;
}

function blogPosts(): string[] {
  return fs.readdirSync(BLOG_DIR, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(BLOG_DIR, entry.name);
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      return [full];
    }
    if (entry.isDirectory()) {
      return ['index.md', 'index.mdx'].map((name) => path.join(full, name)).filter((file) => fs.existsSync(file));
    }
    return [];
  });
}

/** Posts that show a video in their header, with their front matter. */
const videoPosts = blogPosts()
  .map((file) => ({ file: path.relative(WEBSITE_DIR, file), data: frontMatter(file) }))
  .filter((post): post is { file: string; data: Record<string, string> } => Boolean(post.data?.thumbnail));

/** Width and height of a baseline or progressive JPEG, from its first SOF marker. */
function jpegSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.readUInt16BE(0) !== 0xffd8) {
    return null;
  }
  let offset = 2;
  while (offset + 9 < buffer.length) {
    const marker = buffer.readUInt16BE(offset);
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

describe('blog videos', () => {
  test('there are blog videos to check', () => {
    expect(videos.length).toBeGreaterThan(0);
  });

  describe.each(videos)('%s', (name) => {
    const file = path.join(VIDEO_DIR, name);
    const entry = manifest[videoUrl(name)];

    test('is web-ready (H.264, at most 1280 px, no audio, +faststart, within the size budget)', () => {
      expect(findIssues(inspectMp4(file)), FIX).toEqual([]);
    });

    test('has a manifest entry that matches the file', () => {
      expect(entry, `${name} is missing from ${path.relative(WEBSITE_DIR, MANIFEST_FILE)}. ${FIX}`).toBeDefined();
      const info = inspectMp4(file);
      expect(entry.sha256, `${name} changed since the manifest was written. ${FIX}`).toBe(sha256(file));
      expect({ width: entry.width, height: entry.height }).toEqual({ width: info.video?.width, height: info.video?.height });
      expect(entry.duration).toBeCloseTo(info.duration, 1);
    });

    test('has a JPEG poster at the video size', () => {
      expect(entry, FIX).toBeDefined();
      expect(entry.poster).toBe(videoUrl(name.replace(/\.mp4$/, '.jpg')));
      const poster = path.join(STATIC_DIR, entry.poster);
      expect(fs.existsSync(poster), `${entry.poster} is missing. ${FIX}`).toBe(true);
      const buffer = fs.readFileSync(poster);
      expect(jpegSize(buffer)).toEqual({ width: entry.width, height: entry.height });
      expect(buffer.length).toBeLessThanOrEqual(MAX_POSTER_BYTES);
    });
  });

  test('the manifest only lists videos that exist', () => {
    const stale = Object.keys(manifest).filter((url) => !videos.includes(path.basename(url)));
    expect(stale, FIX).toEqual([]);
  });
});

describe('blog posts with a video', () => {
  test.each(videoPosts.map((post) => [post.file, post.data] as const))('%s', (file, data) => {
    const video = data.thumbnail;
    expect(video, `${file}: thumbnail must be a /videos/*.mp4 path`).toMatch(/^\/videos\/[^/]+\.mp4$/);
    expect(fs.existsSync(path.join(STATIC_DIR, video)), `${file}: ${video} does not exist`).toBe(true);
    expect(manifest[video], `${file}: ${video} has no manifest entry. ${FIX}`).toBeDefined();
    // The VideoObject data and social previews are built from these.
    expect(data.title, `${file}: needs a title`).toBeTruthy();
    expect(data.description, `${file}: needs a description`).toBeTruthy();
    expect(data.date, `${file}: needs a date`).toMatch(/^\d{4}-\d{2}-\d{2}/);
    // Without an image the post falls back to the generic social card; `npm run thumbnails -w apps/website` makes one.
    expect(data.image, `${file}: needs an image for social previews (run \`npm run thumbnails -w apps/website\`)`).toBeTruthy();
    expect(fs.existsSync(path.join(STATIC_DIR, data.image)), `${file}: ${data.image} does not exist`).toBe(true);
  });
});
