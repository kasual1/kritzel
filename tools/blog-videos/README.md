# Blog videos

Makes the videos in `apps/website/static/videos` web-ready, and keeps the data the blog needs to describe them for
search engines in `apps/website/src/data/blog-videos.json`.

```bash
npm run videos:optimize                                 # fix every video, write posters, thumbnails and the manifest
npm run videos:check                                    # change nothing; exit 1 if anything needs fixing
npm run videos:optimize -- --thumbnail-at Name.mp4=12.5 # use the frame at 12.5 s as that video's thumbnail
```

Run `npm run videos:optimize` after adding or replacing a video, and commit the video, its poster, its thumbnail and the manifest.
It needs `ffmpeg` and `ffprobe` on the `PATH`; `--check` doesn't.

## What it does

For each MP4 that breaks one of the rules below it:

- **re-encodes** it when it's wider than 1280 px, too big or not H.264: H.264 (`libx264`, `-preset slow`) at most
  1280 px wide with even dimensions and square pixels, trying CRF 24, 26, … 32 until it fits the size budget;
- otherwise only **remuxes** it, which drops the audio and moves the `moov` box to the front without touching the
  picture.

Then it saves two frames next to the video:

- the **poster** `<name>.jpg`, always the first frame. The page shows it until the video plays, so playback
  continues from exactly that picture instead of jumping;
- the **thumbnail** `<name>.thumbnail.jpg`, the frame search engines show for the video (VideoObject
  `thumbnailUrl`). It's never shown on the page, so it can be the most telling moment: by default the most detailed
  of a dozen frames sampled across the video, which skips empty or fading frames. Pick one with `--thumbnail-at`; a
  picked frame is kept until the video changes.

Finally it records poster, thumbnail, size, duration and a SHA-256 of the video in the manifest.

A video that already follows the rules and matches its manifest entry is left alone, so the script is cheap to run
again and in CI. The deploy workflow runs it before the build, so the deployed site is web-ready even when a video
was committed without it.

## The rules

They live in `rules.mjs`, and the website tests (`apps/website/tests/blog-videos.spec.ts`) enforce them on every pull
request, together with an up-to-date manifest entry, poster and thumbnail:

| Rule | Why |
| --- | --- |
| H.264 video (`avc1`) | Plays in every browser, also Safari and older phones. |
| `moov` box before the media data (`+faststart`) | The browser can show the first frame without loading the end of the file first. |
| Not fragmented, with a duration | Fragmented files (OBS, MediaRecorder) report no duration, which hides their real bitrate. |
| No audio track | Blog videos always play muted; audio only adds bytes. |
| At most 1280 px wide | The blog shows videos at most 640 CSS px wide, so 1280 px stays sharp on 2x screens. |
| At most 2 Mbit/s and 5 MB | Keeps the page fast; screen recordings at 720p need far less. |

`mp4.mjs` reads just enough of the MP4 format to check these, so the tests run without ffmpeg.

## How the blog uses it

`apps/website/src/theme/BlogPostItem/Header` reads the manifest for every post with a `thumbnail` video:

- the `<video>` gets the poster and its real size, so the page paints the poster at once and the layout doesn't shift;
- the post page adds `VideoObject` structured data (with the thumbnail), `og:video` tags and a high-priority preload
  of the poster;
- the blog list loads no video until it scrolls into view (`preload="none"`) and pauses videos that leave the view.

`apps/website/tests/blog-video-output.spec.ts` checks the built pages for all of this
(`npm run test:videos-output -w apps/website`, after a build).
