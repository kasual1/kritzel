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
| `#/agentic-canvas` | An infinite agentic canvas: Claude builds web pages in frames from the chat box. |

## Agentic canvas

`src/infographics/agentic-canvas/` is the showcase for the "infinite agentic canvas" blog series. The editor shows its chat
box instead of the toolbar. Every prompt runs Claude in a tool-use loop (`canvas-agent.ts`) whose tools
(`canvas-tools.ts`) add, write, move and delete frames: `KritzelIframeObject`s with a titlebar and no rotation. A frame
shows a skeleton while Claude writes it, and the play button in its titlebar opens the page fullscreen.

Claude can put the red running shoe from the website's agentic landing page into its pages: the photos live in
`public/products/` and `product-photos.ts` describes them to Claude, since it cannot see them. A page about the shoe is
designed as a fashion website.

To try it, add an Anthropic API key to `agent-config.ts`, or create `apps/infographics/.env.local` with:

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

The key is used straight from the browser, so only run this locally.

## Record

```bash
npm run record -- --url=http://localhost:5180/#/welcome --width=1280 --height=720 --name=welcome
```

## Add an infographic

Create a component under `src/infographics/<name>/` that renders a `KritzelEditor` with its scene in
`workspaces`, and register it in `src/infographic-routes.ts`. For an SVG path that should draw itself
on load, render `PathDrawingInfographic` from `src/infographics/shared/` with a drawing factory.
