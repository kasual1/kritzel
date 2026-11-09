// Makes every blog video in apps/website/static/videos web-ready and keeps their manifest up to date.
//
//   npm run videos:optimize                                 # fix all videos, write posters and the manifest
//   npm run videos:optimize -- --check                      # change nothing; exit 1 if anything needs fixing
//   npm run videos:optimize -- --thumbnail-at Name.mp4=12.5 # use the frame at 12.5 s as that video's thumbnail
//
// For each MP4 it:
//  - re-encodes it when it's too wide, too big or not H.264: H.264 at most 1280 px wide, no audio, +faststart;
//  - otherwise only remuxes it when it still has audio or no +faststart, which keeps the picture untouched;
//  - writes a poster <name>.jpg next to it: the first frame, which the page shows until the video plays, so the
//    video starts without a jump;
//  - writes a thumbnail <name>.thumbnail.jpg: the frame search engines show for the video. It's the most detailed
//    of a dozen sampled frames, unless --thumbnail-at picks one;
//  - records both, size, duration and a hash of the file in apps/website/src/data/blog-videos.json.
// A video that is already fine and matches its manifest entry is left alone, so running this again is cheap.
// Needs ffmpeg and ffprobe on the PATH, except with --check.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { inspectMp4 } from './mp4.mjs';
import { LIMITS, MANIFEST_FILE, VIDEO_DIR, findIssues, sha256, videoUrl } from './rules.mjs';

/** Quality steps for re-encoding: the first one whose result fits the limits wins. */
const CRF_STEPS = [24, 26, 28, 30, 32];
/** How many frames are compared to pick a thumbnail, and how much of the start and end is skipped. */
const THUMBNAIL_SAMPLES = 12;
const THUMBNAIL_MARGIN = 0.05;

function parseArgs(argv) {
  const args = { check: false, thumbnailAt: new Map() };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--check') {
      args.check = true;
    } else if (arg === '--thumbnail-at' || arg.startsWith('--thumbnail-at=')) {
      const value = arg.startsWith('--thumbnail-at=') ? arg.slice('--thumbnail-at='.length) : argv[++index];
      const match = value?.match(/^(.+\.mp4)=(\d+(?:\.\d+)?)$/);
      if (!match) {
        throw new Error(`Invalid --thumbnail-at "${value}". Use --thumbnail-at Name.mp4=12.5`);
      }
      args.thumbnailAt.set(match[1], Number(match[2]));
    } else {
      throw new Error(`Unknown argument "${arg}".`);
    }
  }
  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) {
    throw new Error(`Could not run ${command}: ${result.error.message}. Is ffmpeg installed?`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr?.toString().trim()}`);
  }
  return result;
}

function ffmpeg(args, options) {
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], options);
}

function readManifest() {
  return fs.existsSync(MANIFEST_FILE) ? JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8')) : {};
}

function writeManifest(manifest) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
}

/** True when the video only needs a remux (drop audio, move moov) rather than a re-encode. */
function needsReencode(info) {
  return (
    info.video?.codec !== LIMITS.codec ||
    info.video.width > LIMITS.maxWidth ||
    info.bitrate > LIMITS.maxBitrate ||
    info.size > LIMITS.maxBytes
  );
}

function remux(input, output) {
  ffmpeg(['-i', input, '-map', '0:v:0', '-c', 'copy', '-an', '-map_metadata', '-1', '-movflags', '+faststart', '-f', 'mp4', output]);
}

function reencode(input, output, crf) {
  ffmpeg([
    '-i', input,
    '-map', '0:v:0', '-an', '-map_metadata', '-1',
    // H.264 in 4:2:0 needs even dimensions, so the width is rounded down to an even number too; square pixels keep
    // the display size (what the MP4 header reports) equal to the frame size.
    '-vf', `scale='trunc(min(${LIMITS.maxWidth},iw)/2)*2':-2:flags=lanczos,setsar=1,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high',
    '-movflags', '+faststart', '-f', 'mp4',
    output,
  ]);
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Where a video is written while it's being fixed: next to it, so the final rename stays on one file system, but
 * hidden and without the .mp4 extension, so a run that crashed never leaves something that looks like a blog video.
 */
function tempFile(file) {
  return path.join(path.dirname(file), `.${path.basename(file)}.optimizing`);
}

/** Fixes one video in place. Returns a description of what was done. */
function fixVideo(file) {
  const before = inspectMp4(file);
  const temp = tempFile(file);
  try {
    if (!needsReencode(before)) {
      remux(file, temp);
      if (!findIssues(inspectMp4(temp)).length) {
        fs.renameSync(temp, file);
        return 'remuxed (audio dropped, +faststart)';
      }
      // e.g. a fragmented file whose real bitrate only shows once it is remuxed: re-encode it after all
    }
    for (const crf of CRF_STEPS) {
      reencode(file, temp, crf);
      const after = inspectMp4(temp);
      if (!findIssues(after).length) {
        fs.renameSync(temp, file);
        return `re-encoded at CRF ${crf}: ${formatBytes(before.size)} → ${formatBytes(after.size)}, ${after.video.width}×${after.video.height}`;
      }
    }
    throw new Error(`${path.basename(file)} is still too big at CRF ${CRF_STEPS.at(-1)}: ${findIssues(inspectMp4(temp)).join('; ')}`);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

/** The most detailed frame: the one whose small JPEG is the largest, which skips blank or fading frames. */
function pickThumbnailTime(file, duration) {
  let best = { time: duration / 2, bytes: -1 };
  for (let sample = 0; sample < THUMBNAIL_SAMPLES; sample++) {
    const time = duration * (THUMBNAIL_MARGIN + ((1 - 2 * THUMBNAIL_MARGIN) * sample) / (THUMBNAIL_SAMPLES - 1));
    const { stdout } = ffmpeg(['-ss', time.toFixed(3), '-i', file, '-frames:v', '1', '-vf', 'scale=320:-2', '-q:v', '4', '-f', 'image2', '-c:v', 'mjpeg', 'pipe:1']);
    if (stdout.length > best.bytes) {
      best = { time, bytes: stdout.length };
    }
  }
  return Math.round(best.time * 100) / 100;
}

/** Saves the frame at `time` seconds as a JPEG. */
function writeFrame(file, image, time) {
  // ffmpeg exits successfully without writing anything when there is no frame at that time, so check the result.
  fs.rmSync(image, { force: true });
  const seek = time > 0 ? ['-ss', time.toFixed(3)] : [];
  ffmpeg([...seek, '-i', file, '-frames:v', '1', '-q:v', '3', '-map_metadata', '-1', '-fflags', '+bitexact', '-f', 'image2', '-c:v', 'mjpeg', image]);
  if (!fs.existsSync(image) || fs.statSync(image).size === 0) {
    throw new Error(`Could not save the frame at ${time} s of ${path.basename(file)}.`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = fs.existsSync(VIDEO_DIR) ? fs.readdirSync(VIDEO_DIR).filter((name) => name.endsWith('.mp4') && !name.startsWith('.')).sort() : [];
  for (const name of args.thumbnailAt.keys()) {
    if (!files.includes(name)) {
      throw new Error(`--thumbnail-at names "${name}", which is not in ${VIDEO_DIR}.`);
    }
  }
  const manifest = readManifest();
  const next = {};
  const problems = [];

  for (const name of files) {
    const file = path.join(VIDEO_DIR, name);
    const url = videoUrl(name);
    const issues = findIssues(inspectMp4(file));
    if (issues.length) {
      if (args.check) {
        problems.push(...issues.map((issue) => `${name} ${issue}`));
        next[url] = manifest[url];
        continue;
      }
      console.log(`${name}: ${fixVideo(file)}`);
    }

    const info = inspectMp4(file);
    const hash = sha256(file);
    const posterName = name.replace(/\.mp4$/, '.jpg');
    const thumbnailName = name.replace(/\.mp4$/, '.thumbnail.jpg');
    const posterFile = path.join(VIDEO_DIR, posterName);
    const thumbnailFile = path.join(VIDEO_DIR, thumbnailName);
    const previous = manifest[url];
    const requestedTime = args.thumbnailAt.get(name);
    if (requestedTime !== undefined && requestedTime >= info.duration) {
      throw new Error(`--thumbnail-at ${name}=${requestedTime} is past the end of the video (${info.duration.toFixed(2)} s).`);
    }
    const upToDate =
      previous?.sha256 === hash &&
      previous.thumbnail === videoUrl(thumbnailName) &&
      fs.existsSync(posterFile) &&
      fs.existsSync(thumbnailFile) &&
      requestedTime === undefined;

    if (upToDate) {
      next[url] = previous;
      continue;
    }
    if (args.check) {
      problems.push(`${name} has no up-to-date poster, thumbnail and manifest entry`);
      next[url] = previous;
      continue;
    }
    // Keep a thumbnail frame that was chosen by hand, as long as the video itself did not change.
    const keptTime = previous?.sha256 === hash ? previous.thumbnailTime : undefined;
    const time = requestedTime ?? keptTime ?? pickThumbnailTime(file, info.duration);
    writeFrame(file, posterFile, 0);
    writeFrame(file, thumbnailFile, time);
    next[url] = {
      poster: videoUrl(posterName),
      thumbnail: videoUrl(thumbnailName),
      thumbnailTime: time,
      width: info.video.width,
      height: info.video.height,
      duration: Math.round(info.duration * 100) / 100,
      sha256: hash,
    };
    console.log(`${name}: poster from the first frame, thumbnail at ${time} s, manifest updated`);
  }

  for (const url of Object.keys(manifest)) {
    if (!(url in next)) {
      if (args.check) {
        problems.push(`the manifest lists ${url}, which no longer exists`);
      } else {
        console.log(`${url}: removed from the manifest`);
      }
    }
  }

  if (args.check) {
    if (problems.length) {
      console.error(`Blog videos need optimizing (run \`npm run videos:optimize\`):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
      process.exitCode = 1;
    } else {
      console.log(`All ${files.length} blog videos are web-ready.`);
    }
    return;
  }
  writeManifest(Object.fromEntries(Object.entries(next).filter(([, entry]) => entry)));
  console.log(`Checked ${files.length} blog videos.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
