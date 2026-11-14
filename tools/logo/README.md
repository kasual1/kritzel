# Logo

Generates every variant of the Updraw logo from a mark drawn in Updraw itself.

```bash
npm run logo:generate -- path/to/updraw-logo.json              # write all variants into the repo
npm run logo:generate -- path/to/updraw-logo.json --out preview # write them into ./preview instead, to look first
```

1. Draw the logo in Updraw as a single stroke, on an otherwise empty workspace.
2. Export the workspace as JSON. The tool takes the one `KritzelPath` in it; its `d` attribute is the filled outline
   of the stroke.
3. Run the command above, then `npm run thumbnails` in `apps/website` so the blog thumbnails redraw their
   "updraw / blog" label with the new logo. A thumbnail whose file name doesn't match its post's slug is treated as
   custom and skipped; re-render it with `npm run thumbnails -- --seed <its thumbnailSeed> --out <its image>`.
4. Look at the result: the README, the website (`npm run docs:start`: landing page, blog, docs navbar, footer) and
   the favicons in a browser tab. Then commit everything.

It needs Chromium for Playwright (`npx playwright install chromium`), which renders the rasters and measures the path.

## What it writes

The path is only moved so its bounding box starts at 0,0. It is never scaled out of proportion, redrawn or smoothed.

| Variant                     | Files                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| README badge                | `logo.svg`: white rounded tile with a light grey border                                                                  |
| Bare mark                   | `apps/website/static/img/logo.svg` (black), `logo_dark.svg` (white), `logo.png`                                          |
| Light tile (website)        | `apps/website/static/img/favicon.svg`, `apps/website/static/favicon.ico`, `apps/website/static/img/logo_avatar.png` (full-bleed, used as apple-touch-icon) |
| Dark tile (app)             | `apps/website/static/img/favicon_dark.svg`, and in `apps/app/client/public/`: `favicon.svg`, `favicon.ico`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png` |
| Inline mark on the website  | `UPDRAW_LOGO_PATH` and `UPDRAW_LOGO_VIEWBOX` in `apps/website/src/components/Landing/paths.ts`, drawn by the landing and agentic heroes and the blog navigation. Their CSS sets only a width, so the height follows the logo's aspect ratio. |

The framework favicons in `apps/core/*` and `apps/demos/*` (Angular, Vue) aren't ours and aren't touched.

## Design rules

These are constants at the top of `generate.mjs`:

- **Size in the tiles** (`SIZES`): the mark's width as a fraction of the tile. The rounded corners have a radius of 35 %
  of the tile, and a triangle's base corners reach into them. So the dark app tiles hold the mark narrower than a
  round mark would need, to keep a visible margin to the corners.
- **Optical centering** (`LIFT`): the mark is lifted by 3.5 % of its height, because a triangle carries its visual
  weight low.
- **Small sizes** (`BOOST`): hand-drawn lines get thinner than a pixel below about 56 px, so favicons and the bare
  marks add 0.25–0.4 px of same-coloured outline there.
  - SVGs do this with size media queries plus `vector-effect: non-scaling-stroke`. The queries see the size the image
    is drawn at, so a large logo is untouched.
  - The small ICO frames have the outline baked in.
