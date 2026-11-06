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
box instead of the toolbar. Every prompt runs Claude in a tool-use loop (`canvas-agent.ts`). Claude is a `KritzelAgent` with
its own cursor and history: its `add_iframe` tool places a `KritzelIframeObject` with a titlebar that renders the page
Claude wrote (through `agent.addObject()`), and `agent.tools()` adds `observe_canvas`, `move_object`, `resize_object` and
`delete_objects` so Claude can see and arrange its pages.

To try it, copy `.env.example` at the repository root to `.env` and set your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
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
