# Recorder

Records a website and your live interactions with it as a video, at a fixed size. Use it for short,
consistent clips of app.kritzel.io for the blog.

```bash
npm run record -- --url=https://app.kritzel.io --width=640 --height=360 --name=whiteboard-intro
```

A Chromium window opens at the given size. Interact with the page, then close the window or press
`Ctrl+C` in the terminal. The video is saved to `tools/recorder/recordings/<name>.webm`.

## Options

| Option        | Default                     | Description                                                        |
| ------------- | --------------------------- | ------------------------------------------------------------------ |
| `--url`       | (required)                  | Page to open.                                                      |
| `--width`     | `640`                       | Viewport and video width in px.                                    |
| `--height`    | `360`                       | Viewport and video height in px.                                   |
| `--name`      | timestamp                   | Output file name (without extension).                              |
| `--out`       | `tools/recorder/recordings` | Output directory.                                                  |
| `--no-cursor` |                             | Don't draw the recorded cursor and click ripples.                  |
| `--fresh`     |                             | Use a throwaway browser profile instead of `tools/recorder/.profile`. |
| `--headless`  |                             | Run without a window (only useful for testing the tool itself).    |

## Notes

- The browser profile is kept in `tools/recorder/.profile` (git-ignored), so logins and app state
  survive between takes. Use `--fresh` for a clean start.
- Screen recordings don't capture the OS cursor, so the tool draws the Kritzel engine's default cursor
  (the `mousePointer` icon, read from `libs/engine/core/src/classes/registries/icon-registry.class.ts`)
  and a click ripple into the page. The real cursor is hidden inside the page so you see exactly what gets recorded.
- Only the first tab is recorded.
- Output is Playwright's native `.webm` (VP8). Recording starts when the browser opens, so the first
  moment shows the page loading; trim it when converting to the final blog format.
- Needs a desktop session (it opens a real browser window) and Playwright's Chromium
  (`npx playwright install chromium` if it's missing).
