# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

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
