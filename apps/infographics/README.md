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

## Record

```bash
npm run record -- --url=http://localhost:5180/#/welcome --width=1280 --height=720 --name=welcome
```

## Add an infographic

Create a component under `src/infographics/<name>/` that renders a `KritzelEditor` with its scene in
`workspaces`, and register it in `src/infographic-routes.ts`. For an SVG path that should draw itself
on load, render `PathDrawingInfographic` from `src/infographics/shared/` with a drawing factory.
