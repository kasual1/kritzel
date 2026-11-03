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
| `#/generative-ui` | Generative UI: Claude adds pages from the chat box, and edits the element you pick in one. |

## Agentic canvas

`src/infographics/agentic-canvas/` is the showcase for the "infinite agentic canvas" blog series. The editor shows its chat
box instead of the toolbar. Every prompt runs Claude in a tool-use loop (`canvas-agent.ts`) with a single `add_iframe`
tool, which adds a `KritzelIframeObject` with a titlebar that renders the page Claude wrote.

To try it, copy `.env.example` at the repository root to `.env` and set your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

The key is used straight from the browser, so only run this locally. Vite normally only hands `VITE_*` variables to
the page, so `vite.config.ts` lets `ANTHROPIC_API_KEY` through as well. A `vite build` puts the key into `dist`.

## Generative UI

`src/infographics/generative-ui/` uses the same chat box and API key. The canvas starts with a music player
(`music-player.ts`), so there is something to pick before the first prompt. Without a selection, a prompt adds a new
page (`add_page`). Select a page and it starts picking elements: hovering highlights the element under the pointer and a
click picks it. An inline SVG icon is picked as a whole, and an icon inside a button or link picks the button or link.
A chip above the chat box shows what the next prompt changes, the whole page or the picked element, and its close
button removes the element, then the page. Claude gets the page's current source with the request and changes it with
find-and-replace edits (`edit_page`), so small changes are quick. Prompts don't share a conversation; the pages on the
canvas are the state (`generative-ui-agent.ts`).

## Record

```bash
npm run record -- --url=http://localhost:5180/#/welcome --width=1280 --height=720 --name=welcome
```

## Add an infographic

Create a component under `src/infographics/<name>/` that renders a `KritzelEditor` with its scene in
`workspaces`, and register it in `src/infographic-routes.ts`. For an SVG path that should draw itself
on load, render `PathDrawingInfographic` from `src/infographics/shared/` with a drawing factory.
