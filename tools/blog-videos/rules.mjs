// What makes a blog video web-ready. optimize.mjs fixes these, and the website tests enforce them.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

export const WEBSITE_DIR = path.join(REPO_ROOT, 'apps', 'website');
/** The blog videos, served at /videos/<file>. */
export const VIDEO_DIR = path.join(WEBSITE_DIR, 'static', 'videos');
/** Poster, size and duration of each video, read by the blog header for `poster` and the VideoObject data. */
export const MANIFEST_FILE = path.join(WEBSITE_DIR, 'src', 'data', 'blog-videos.json');

export const LIMITS = {
  /** The blog shows videos at most 640 CSS px wide, so 1280 px stays sharp on 2x screens. */
  maxWidth: 1280,
  /** Average bitrate, audio included. Screen recordings at 720p need far less. */
  maxBitrate: 2_000_000,
  /** Hard cap per file, so a long recording can't slip through on a low bitrate. */
  maxBytes: 5 * 1024 * 1024,
  /** H.264 plays everywhere, also in Safari and on old phones. */
  codec: 'avc1',
};

/** Public URL of a file in static/videos. */
export function videoUrl(file) {
  return `/videos/${file}`;
}

export function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** Everything wrong with an inspected video (see mp4.mjs), as readable sentences. Empty when it's web-ready. */
export function findIssues(info) {
  const issues = [];
  if (!info.video) {
    issues.push('has no video track');
    return issues;
  }
  if (info.video.codec !== LIMITS.codec) {
    issues.push(`uses the "${info.video.codec}" codec instead of H.264 ("${LIMITS.codec}")`);
  }
  if (!info.faststart) {
    issues.push('stores its "moov" box after the media data, so browsers have to load the end of the file before the first frame (needs +faststart)');
  }
  if (info.hasAudio) {
    issues.push('has an audio track, but blog videos always play muted');
  }
  if (info.video.width > LIMITS.maxWidth) {
    issues.push(`is ${info.video.width} px wide, more than the ${LIMITS.maxWidth} px the blog needs`);
  }
  if (info.bitrate > LIMITS.maxBitrate) {
    issues.push(`averages ${(info.bitrate / 1e6).toFixed(2)} Mbit/s, more than ${(LIMITS.maxBitrate / 1e6).toFixed(2)} Mbit/s`);
  }
  if (info.size > LIMITS.maxBytes) {
    issues.push(`is ${(info.size / 1024 / 1024).toFixed(1)} MB, more than ${(LIMITS.maxBytes / 1024 / 1024).toFixed(1)} MB`);
  }
  return issues;
}
