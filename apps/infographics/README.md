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
| `#/agentic-canvas-generative-ui` | Generative UI on the agentic canvas: one prompt adds the recorder widget. |
| `#/agentic-canvas-cursors` | Agentic cursors: Studio records a track with the recorder widget after the prompt "Please record a new track". |
| `#/agentic-canvas-rectangle` | The agentic canvas at its simplest: "Please add a rectangle" adds a rectangle in the middle of the view. |
| `#/generative-ui` | Generative UI: Claude adds pages from the chat box, and edits the element you pick in one. |

## Agentic canvas

`src/infographics/agentic-canvas/` is the hero of the "What is an agentic canvas?" blog post, and uses the same jazz
record as the generative UI and agentic cursor posts. The editor shows its chat box instead of the toolbar. When the page
loads, three prompts are typed into the chat box one after another, and each starts an agent: Studio adds a small
recording widget and keeps recording: it starts each take with the record button and stops it with the next press,
which saves the take to the list below. Studio presses record as soon as the widget is done. Covers draws four jazz covers for "Full Control" in a square in the middle of the canvas, and Social
writes a social media post about the release. The work runs from left to right: widget, covers, post. The camera follows each agent to its work and finally pulls back to show
all three results. Every agent's cursor leaves the view as soon as that agent is done. Each agent is a `KritzelAgent`: it is added
with `editor.addAgent()` when its cursor enters and is removed with `editor.removeAgent()` when it leaves. The agents
work through their agent actions: each places its pages with `agent.addObject()`, so every page is that agent's change,
and Studio presses the record button and the star of the favorite take with `agent.click()`. Between actions the
cursors glide with `agent.moveTo()`. The takes are saved by the widget, not by Studio. The agents only show as cursors
(`isAgentAvatarsVisible` is off). The scene is scripted in `hero-scene.ts`, with no model calls, so every recording is
the same; reload the page to play it again.

Every page the agents add comes in smoothly: it fades in while it rises into place, and when it was showing the glare
placeholder, its content fades in over the placeholder's grey. Both are Kritzel's own: objects placed with
`agent.addObject()` or added with `editor.addObject(s)` play the appear animation of the theme (`objectAppear`). The
agentic canvas generative UI and agentic canvas cursors pages get the same effect.

The album covers are PNG images in `public/covers/`, listed in `album-covers.ts`. Their sources are the SVG files in
`covers/`; after changing one, render the PNGs again with `npm run covers -w apps/infographics`.

## Agentic canvas generative UI

`src/infographics/agentic-canvas-generative-ui/` shows generative UI on the same canvas as the agentic canvas page, with
the chat box and no agentic cursors. "Please generate a recorder widget" is typed into the chat box, and the recorder
widget of the agentic canvas page (the same one the agentic canvas cursors page shows) is added in the middle of the
canvas: it shows the glare placeholder first and then the widget. 1.5 seconds later every object is removed. The Studio
agent places the widget with `agent.addObject()`, so the widget is its change, but the agent is hidden: it is added with
`visible: false`, the action runs with `instant: true`, and `isAgentAvatarsVisible` is off. It is scripted in
`recorder-scene.ts` and reuses the widget and the helpers of the agentic canvas page.

## Agentic canvas cursors

`src/infographics/agentic-canvas-cursors/` shows an agentic cursor working on a generative UI page, with the chat box. The
recorder widget of the agentic canvas page is on the canvas from the start, as an initial object of the workspace. After
1.5 seconds "Please record a new track" is typed into the chat box. Studio's cursor comes in from the top right and starts
a recording with `agent.click()` on the record button, waits beside it for 2.5 seconds, and stops the recording with a
second click. Stopping saves one track below the widget, and the cursor leaves the view. The widget and the track stay on
the canvas. It is scripted in `record-track-scene.ts` and reuses the widget, the track and the helpers of the agentic
canvas page; Studio is a `KritzelAgent` there too.

## Agentic canvas rectangle

`src/infographics/agentic-canvas-rectangle/` shows the editor with an empty chat box. After 1.2 seconds "Please add a
rectangle" is typed into the chat box, the loading ring runs briefly, and a rectangle is added in the middle of the view
with `editor.addObjects()`, so it plays Kritzel's appear animation. 1.5 seconds later it is removed again. It is scripted
in `rectangle-scene.ts` and reuses the helpers of the agentic canvas page.

## Generative UI API key

The generative UI page calls the Claude API. To try it, copy `.env.example` at the repository root to `.env` and set your
Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

The key is used straight from the browser, so only run this locally. It is read from the env files at the repository root
only (`.env`, `.env.local` and the mode files, as Vite orders them), never from your shell environment, so a key you
export for other tools is not bundled by accident. Values are taken as written (`${OTHER}` is not expanded). The dev
server restarts when one of these files is created, changed or deleted. A `vite build` puts the key into `dist`.

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

Claude is a `KritzelAgent` with its own cursor, status and history: `add_page` places the page through
`agent.addObject()`, so the user's selection and undo history stay untouched, and `agent.tools()` adds `observe_canvas`,
`move_object`, `resize_object` and `delete_objects` so Claude can see and arrange its pages. While Claude changes a page,
its cursor points at the first picked element (`agent.moveTo({ objectId, selector })`), or at the page when none is
picked.

## Record

```bash
npm run record -- --url=http://localhost:5180/#/welcome --width=1280 --height=720 --name=welcome
```

## Add an infographic

Create a component under `src/infographics/<name>/` that renders a `KritzelEditor` with its scene in
`workspaces`, and register it in `src/infographic-routes.ts`. For an SVG path that should draw itself
on load, render `PathDrawingInfographic` from `src/infographics/shared/` with a drawing factory.
