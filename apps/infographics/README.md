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
| `#/agentic-canvas` | Hero of the agentic canvas post: three agents help release the jazz song "Full Control". |
| `#/generative-ui` | Generative UI: Claude adds pages from the chat box, and edits the element you pick in one. |

## Agentic canvas

`src/infographics/agentic-canvas/` is the hero of the "What is an agentic canvas?" blog post, and uses the same jazz
record as the generative UI and agentic cursor posts. The editor shows its chat box instead of the toolbar. When the page
loads, three prompts are typed into the chat box one after another, and each starts an agent: Studio adds a small
recording widget and keeps recording: it starts each take with the record button and stops it with the next press,
which saves the take to the list below. The camera moves on with the first press, Covers draws four jazz covers for "Full Control" in a square in the middle of the canvas, and Social
writes a social media post about the release. The work runs from left to right: widget, covers, post. The camera follows each agent to its work and finally pulls back to show
all three results. Every agent's cursor leaves the view as soon as that agent is done. The scene is scripted in `hero-scene.ts` (covers in `album-covers.ts`), with no model calls, so every
recording is the same; reload the page to play it again.

## Generative UI API key

The generative UI page calls the Claude API. To try it, copy `.env.example` at the repository root to `.env` and set your
Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

The key is used straight from the browser, so only run this locally. Vite normally only hands `VITE_*` variables to
the page, so `vite.config.ts` lets `ANTHROPIC_API_KEY` through as well. A `vite build` puts the key into `dist`.

## Generative UI

`src/infographics/generative-ui/` uses the chat box and the API key above. The canvas starts with a music player
(`music-player.ts`), so there is something to pick before the first prompt. Without a selection, a prompt adds a new
page (`add_page`). Select a page and it starts picking elements: hovering highlights the element under the pointer and a
click picks it. Cmd-, Ctrl- or Shift-click adds an element to the picked ones or removes it again, while a plain click
starts over. An inline SVG icon is picked as a whole, and an icon inside a button or link picks the button or link.
The chat box chips show what the next prompt changes: one chip per picked element, or a page chip when none is picked.
An element chip's close button drops that element, the page chip's deselects the page. Claude gets the page's current source with the request and changes it with
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
