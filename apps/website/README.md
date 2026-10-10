# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Landing hero layout

The `/agentic` page has its own hero, CTA controls, and stylesheet under
`src/components/Agentic`; edit these independently of `src/components/Landing`.
The sections below the hero and basic icon assets remain shared.

Above 768px, the canvas is centered and capped at 1440px, with a viewport-height
target capped at 880px and a 720px minimum. Navigation, descriptions, CTA controls,
and the toolbar/chat retain readable screen-space sizes. Headings scale only
between 48px and 60px. Canvas objects still use container-relative `cqw` units;
1cqw is 1% of the canvas width.

From 769px through 1199px, the hero uses an art-directed tablet/narrow-desktop
composition: the copy has a wider central column. The landing hero hides the
calculator and grass image and centers the handwritten "hallo!" beneath the copy
and CTAs. Separate tablet and desktop instances share the same drawing component.
On entering desktop, the tablet instance fades out over 200ms, then the desktop
instance replays its drawing animation after its 300ms delay. Returning to tablet
replays the centered instance's drawing animation as well; fading is only used
when it disappears. Reduced-motion users see instant changes.
The landing tablet canvas follows the viewport height between 720px and 880px.
On tablet and mobile, the visible SVG strokes' vertical center is measured dynamically
between the bottom of the copy/CTAs and the top of the toolbar. Resize observers
update it as content and viewport dimensions change. Its size adjusts on shorter
tablet screens; screens shorter than 720px can scroll.
The agentic tablet and mobile compositions center the unrotated running shoe
below the copy and hide both the chart and smiley. Separate desktop and compact
shoe instances share a drawing-card component, with independent drag offsets
and entrance animations. Selection and the chat sequence remain shared; focus
layout measures only the visible instance. The shoe is dynamically centered
between the bottom of the copy/CTAs and the
top of the scaled chat box. Resize observers recalculate this space when content
or viewport dimensions change, including during variant generation.
Compact layouts skip the initial chat centering command: the first submission creates the
casual shoe variant directly, and the hero description stays visible and in place
throughout. Desktop retains its initial centering step, which hides the description
and raises the copy to make room for the focused shoe.
The compact canvas has an 800px minimum and an 880px cap, allowing extra room for the chat.
Short screens scroll rather than shrinking the UI. The focus/variant sequence
still centers its cards between the copy and chat and can increase the minimum
height if needed to prevent overlap. On tablet and mobile (1199px and below) the
shoe fades and settles in place at its center instead of sliding in from the left.
Generated variants are stacked on top of it at the same center and width, each
with a slight alternating rotation (+4° and −3.5°), rather than sitting side by
side as on desktop. The cards are fanned out by a few pixels so a strip of each
stays visible. Every card remains selectable and draggable (also by keyboard);
selecting or dragging a card raises it to the top, and that order persists after
deselecting. Card wrappers ignore pointer events so a dragged-away card never
blocks the ones beneath it. Reduced-motion users see the final stack immediately.
Stacked cards keep a fixed width (240px on tablet, 220px on mobile) instead of
scaling with the viewport, and use a slimmer 6px white frame (desktop keeps 10px,
set through the `--image-card-padding` variable of `ImageCard`). On tablet the
hero title (40px) and description (16px) use the mobile sizes to give the stack
more room.
The desktop 3D pie chart plays its drawing animation whenever it becomes visible
(not at mount), so it replays after widening from a tablet or mobile viewport, where
it is hidden.

At 768px and below, the landing hero shows the centered, unrotated handwritten
drawing instead of the calculator and grass image. Demo and Get started remain
side by side; the npm install control is hidden. The canvas follows the viewport
height with a 720px minimum and an 880px cap, spacing the copy, drawing, and
toolbar vertically rather than sizing itself from the copy's bottom padding.
Very short screens scroll to preserve readability. The agentic mobile hero uses
the same side-by-side CTAs and hides the npm install control and Get License
navigation button, while retaining its interactive chat.

Photo captions start beneath their photo wrapper but can be moved independently.

Hero images and captions can be dragged independently or moved with arrow keys
while focused (Shift increases the step). Drag offsets scale with the item size
on resize and reset when the landing page is remounted.

## Blog navigation

Blog listings show the linked Kritzel logo and name in a flat top header. Entries
use the full content width and align with the logo's left edge, without a post-list
sidebar. Listing thumbnails reuse the hero's white image-card frame and shadow.
Both blog layouts use a centered, 1080px maximum-width container with extra
desktop side gutters, keeping the header and content left edges aligned.
Individual posts have no left sidebar. Their flat header replaces the logo with
a back arrow linking to the blog overview. The thumbnail and article use the
left content area, with a sticky table of contents on the right on desktop.
The header scrolls away with the page. Blog pages have no top navigation
links, GitHub icon, mobile menu, or floating navbar. Navigation on other pages is
unchanged.
The right-hand table of contents on individual posts uses a 2rem top offset.
Blog listings and individual posts leave extra responsive space below the content
and reuse the landing page's stylized KRITZEL wordmark immediately above the footer.

## Installation

The website's default and link cursors use 24px SVG assets in `static/img/cursor-*.svg`,
matching the engine's white-filled, black-outline arrow and hand. Hotspots match
`KritzelCursorHelper`: 4,4 for the arrow and 12,12 for the hand. Text fields and
disabled controls keep semantic cursors; embedded demo frames manage their own cursors.

```bash
yarn
```

## Local Development

```bash
yarn start
```

From the repository root, you can also run `npm run docs:start`.
On Windows, development uses Webpack to avoid the Rspack 1.7.12
`cssExtractHmr.js` module-graph panic. CSS hot reload remains enabled.
Production builds and development on other platforms still use Rspack;
the other Docusaurus v4 and faster options remain enabled.

To point LiveDemo previews to a local demo app while running docs locally, set `DEMO_BASE_URL` before starting:

```powershell
$env:DEMO_BASE_URL_ANGULAR="http://localhost:4200"
$env:DEMO_BASE_URL_REACT="http://localhost:5173"
$env:DEMO_BASE_URL_VUE="http://localhost:5174"
yarn start
```

If these are not set, defaults are chosen by environment:

- Development (`yarn start`): Angular `http://localhost:4200`, React `http://localhost:5173`, Vue `http://localhost:5174`
- Production build (`yarn build`): `https://kasual1.github.io/kritzel/{angular|react|vue}`

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Blog thumbnails

Every blog post gets a generated thumbnail (a blurred, squeegee-style painting rendered in resolution steps of dithered pixels). `npm run thumbnails` renders `static/img/blog/<slug>.png` for each post and adds `image: /img/blog/<slug>.png` to its front matter, which Docusaurus uses as the post's `og:image`. It also runs automatically before `npm run build`.

Each image is fully determined by its seed, an arbitrary string of up to 32 characters (`5b1192ef`, `hello kritzel`, …). Eight hex digits are used as the seed number directly, any other text is hashed; the seed also picks the color family (Angular, React or Vue). The seed is printed in the image's bottom right corner and stored in the post's `thumbnailSeed` front matter; posts without one get a stable hex seed from their slug. Edit `thumbnailSeed` to re-roll a thumbnail: the PNG stores its seed, so the next run re-renders it. `--force` regenerates everything and `--slug <slug>` targets one post. Commit the generated PNGs.

`npm run thumbnails -- --seed 5b1192ef --scale 4` renders any seed on its own (here at 4800×2520); `--seed random` picks a fresh one. The generator core (`scripts/thumbnails/lib.mjs`, `palettes.mjs`, `painting.mjs`) has no Node dependencies and renders the same picture at every scale, so it can also run in the browser; `render.mjs` adds PNG output via resvg. The label is drawn with system fonts, so generate thumbnails on a machine with Inter or Segoe UI installed.

## LLM Documentation

Production builds publish `/llms.txt` and Markdown versions of all public Angular, React, and Vue documentation, for example `/docs/react/getting-started/quick-start.md`. A combined `llms-full.txt` is intentionally not generated. The plugin owns these files; do not add a competing static index or commit build output.

The index introduction and plugin options live in [docusaurus.config.ts](docusaurus.config.ts). Detailed content comes from the existing documentation sources. Update those sources normally, then rebuild. `LiveDemo` tags retain their repository, source-file, and demo-route metadata; the exporter does not execute components or download demo code.

Run these commands from the repository root:

```bash
npm run test -w apps/website
npm run build -w apps/website
npm run test:llms -w apps/website
npm run serve -w apps/website -- --port 3001
```

Choose another port if 3001 is occupied. Fetch `http://localhost:3001/llms.txt` and a framework Markdown URL to inspect production output. The development server does not generate these files.

Use `npm run build`, not a direct `docusaurus build` invocation: the npm `postbuild` step verifies the index and normalizes root-relative links in Markdown exports for subpath deployments. It uses parsed link positions to leave code samples and `LiveDemo` metadata intact. A missing index or missing linked Markdown file fails this step.

The build-output contracts require an existing production build and are separate from the source-only `test` and `test:watch` commands. They check the Docusaurus document inventory, index ordering, preserved examples, local link targets, and discovery metadata. CI checks both `/` and `/preview/`; deployment runs these contracts before uploading the build artifact.

To check a subpath deployment locally in PowerShell, set the same base URL for both build and validation:

```powershell
$previousBaseUrl = $env:Docusaurus_BASE_URL
try {
	$env:Docusaurus_BASE_URL = '/preview/'
	npm run build -w apps/website
	if ($LASTEXITCODE -ne 0) { throw 'Website build failed' }
	npm run test:llms -w apps/website
	if ($LASTEXITCODE -ne 0) { throw 'LLM output validation failed' }
} finally {
	$env:Docusaurus_BASE_URL = $previousBaseUrl
}
```

Rebuild with the default base URL before returning to root-path production previews. Keep `Docusaurus_BASE_URL` consistent when serving a subpath build.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
