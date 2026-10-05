# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Landing hero layout

Above 768px, the hero fills the initial viewport using `100svh`, with a minimum
height of half its width to avoid crowding on short screens. The toolbar sits
inside the canvas and the features begin below it. The canvas is centered and
capped at 1440px. Container-relative
`cqw` units scale typography, images, notes, controls, and the toolbar together;
1cqw is 1% of the canvas width. Keep hero dimensions relative to that container
rather than mixing fixed pixels and viewport units. Photo captions remain inside
their photo wrapper so they move together. The mobile layout is separate.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

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
