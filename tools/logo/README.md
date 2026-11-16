# Logo

Generates every variant of the Upmade logo from one source mark.

```bash
npm run logo:generate                                  # write all variants into the repo, from source/upmade-mark.svg
npm run logo:generate -- --out preview                 # write them into ./preview instead, to look first
npm run logo:generate -- path/to/mark.svg --out preview --size 0.9   # try another mark, 10 % smaller in the tiles
npm run logo:generate -- path/to/upmade-export.json    # or a mark drawn in Upmade as a single stroke
```

## The mark

`source/upmade-mark.svg` is the logo: the founder's hand-drawn "up" (a U whose left arm rises into an arrow, flowing
into a p), drawn in the Upmade app, then refined and redrawn with the Upmade pen. It's two pen strokes, the arrowhead
and the body, each a filled outline in the same `M/Q/T` path data the app exports.

To change the logo, replace that file or pass an Upmade workspace export that holds the mark drawn as a single
stroke (exports from Updraw or Kritzel work too). An SVG source must be filled `<path d>` elements in one coordinate
space, using absolute `M L Q T C S Z` commands: no transforms, nested `<svg>`, other shapes, unfilled or even-odd paths
(the tool refuses those with an error; flatten such a file first, e.g. in a vector editor). The tool only moves the paths so the mark starts at 0,0;
it never scales them out of proportion, redraws or smooths them.

After running it:

1. Run `npm run thumbnails` in `apps/website` so the blog thumbnails redraw their "upmade / blog" label with the new
   logo. A thumbnail whose file name doesn't match its post's slug is treated as custom and skipped; re-render it with
   `npm run thumbnails -- --seed <its thumbnailSeed> --out <its image>`.
2. Look at the result: the website (`npm run docs:start`: landing page, blog, docs navbar, footer) and the favicons in
   a browser tab. Then commit everything.

It needs Chromium for Playwright (`npx playwright install chromium`), which renders the rasters and measures the path.

## What it writes

| Variant                     | Files                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Bare mark                   | `apps/website/static/img/logo.svg` (black), `logo_dark.svg` (white), `logo.png`                                          |
| Light tile (website)        | `apps/website/static/img/favicon.svg`, `apps/website/static/favicon.ico`, `apps/website/static/img/logo_avatar.png` (full-bleed, used as apple-touch-icon) |
| Dark tile (app)             | `apps/website/static/img/favicon_dark.svg`, and in `apps/app/client/public/`: `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png` |
| App tab icon (dark, bigger) | `apps/app/client/public/favicon.svg`, `apps/app/client/public/favicon.ico`                                                |
| Inline mark on the website  | `UPMADE_LOGO_PATH`, `UPMADE_LOGO_VIEWBOX` and `UPMADE_LOGO_STROKE_WIDTH` in `apps/website/src/components/Landing/paths.ts`, drawn by the landing and agentic heroes and the blog navigation. Their CSS sets only a height, so the width follows the logo's aspect ratio. |
| README badge                | `logo.svg` (repo root): white rounded tile with a light grey border, shown at 160 px in the main README                  |

The framework favicons in `apps/core/*` and `apps/demos/*` (Angular, Vue) aren't ours and aren't touched.

## Design rules

These are constants at the top of `generate.mjs`:

- **Size in the tiles** (`SIZES`, scaled by `--size` for a one-off run): the mark's larger side (its height) as a
  fraction of the tile. The light and dark tiles use 66 %; the app's tab icon uses 72 % so it reads in a browser tab.
  The rounded corners have a radius of 35 % of the tile, so the mark stays well inside them.
- **Line weight** (`WEIGHT`, or `--weight` for a one-off run): an optional same-coloured outline around every stroke,
  in path units. The current mark is drawn at its final weight, so it's 0. The website constants and the blog
  thumbnails draw the same outline when it's set.
- **README badge** (`README_BADGE`): the mark's size in the badge, the same 66 % as the light tile. `null` would
  leave the committed `logo.svg` as it is.
- **Optical centering** (`LIFT`): lifts the mark by this fraction of its height inside the tiles; 0 for the current
  mark.
- **Small sizes** (`BOOST`): in a favicon the mark's lines are under a pixel at 16 px and only 1–2.5 px at 24–48 px,
  so the tile icons widen the strokes by 0.25–0.4 px there to keep them crisp.
  - SVGs do this with size media queries plus `vector-effect: non-scaling-stroke`. The queries see the size the image
    is drawn at, so a large icon is untouched.
  - The small ICO frames have it baked in.
  - The bare mark doesn't get it: at its smallest use (the 24 px docs navbar) it stays identical to the inline mark on
    the website.
