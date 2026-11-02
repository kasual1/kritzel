# Infographics

A React app where every route hosts its own `kritzel-editor` showing one infographic. The pages
are meant to be recorded with the [recorder](../../tools/recorder/README.md).

Each editor gets its initial scene through the `workspaces` property only — no sync provider and no
custom theme, so what you see is the editor's default look.

## Run

Build the libraries first (`npm run build` at the repo root, or at least `libs/engine/react`,
`libs/editor/core` and `libs/editor/react`), then:

```bash
npm run infographics
```

## Routes

| Route       | Infographic                                     |
| ----------- | ----------------------------------------------- |
| `#/welcome` | The animated "Welcome" path from `apps/app`.   |
| `#/open-source` | The animated outline of the open source logo. |
| `#/agentic-canvas` | An agentic canvas: Claude adds interactive iframe objects from the chat box. |

## Agentic canvas

`src/infographics/agentic-canvas/` is the showcase for the "infinite agentic canvas" blog series. The editor shows its chat
box instead of the toolbar. Every prompt runs Claude in a tool-use loop (`canvas-agent.ts`) with a single `add_iframe`
tool, which adds a `KritzelIframeObject` with a titlebar that renders the page Claude wrote.

To try it, copy `.env.example` at the repository root to `.env`, set your Anthropic API key and (re)start the dev server:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

`vite.config.ts` also reads the key from `apps/infographics/.env` (or `.env.local`), from the shell environment, and
under the name `VITE_ANTHROPIC_API_KEY`. Only the dev server passes it to the page, which calls the Claude API straight
from the browser, so only run this locally. Errors and Claude's replies show above the chat box.

## Record

```bash
npm run record -- --url=http://localhost:5180/#/welcome --width=1280 --height=720 --name=welcome
```

## Add an infographic

Create a component under `src/infographics/<name>/` that renders a `KritzelEditor` with its scene in
`workspaces`, and register it in `src/infographic-routes.ts`. For an SVG path that should draw itself
on load, render `PathDrawingInfographic` from `src/infographics/shared/` with a drawing factory.
