---
name: kritzel
description: 'Integrate the Kritzel infinite canvas (kritzel-editor or kritzel-engine) in Angular, React, or Vue. Use when installing @kritzel/angular-editor, @kritzel/react-editor, or @kritzel/vue-editor; adding a whiteboard or drawing canvas; creating objects; controlling the viewport; registering tools; configuring themes, workspaces, persistence, or collaboration.'
metadata:
  kritzel-version: '0.4.35'
---

# Kritzel

## Choose the framework and component

1. Read the application's `package.json` and existing components to identify Angular, React, or Vue. If more than one applies, use the framework of the component being edited; if none applies, ask which integration is intended.
2. Read only that framework's [setup reference](./references/angular/setup.md) (or [React](./references/react/setup.md) / [Vue](./references/vue/setup.md)). Follow its package, registration, ref, event, and prop conventions. Do not mix framework wrappers.
3. Use `kritzel-editor` for the full canvas and UI. Use `kritzel-engine` for a custom UI around a bare canvas; the engine registers no tools by default. The framework setup reference has a working example of each.
4. Check the installed `@kritzel/*-editor` version before using an API. Prefer the installed package types when they differ from [the generated API reference](./references/api.md), which is stamped with the source version.

## Rules shared by all frameworks

- Give the host a concrete width and height; an unsized canvas will not render.
- Wait for the editor's `isReady` or engine's `isEngineReady` event before method calls. Await asynchronous API methods.
- Read `CustomEvent` payloads from `event.detail` using the framework's event binding conventions.
- Construct objects with `translateX` and `translateY` in world coordinates; use `addObject` or `addObjects` to insert, and `updateObject` to change existing objects rather than mutating them.
- Use `{ light: '#1f2937', dark: '#f3f4f6' }` for theme-aware colors, not a plain color string.
- `setViewport`, `panTo`, and `zoomTo` move the camera. Convert pointer coordinates with `screenToWorld` before placing objects.
- Use a distinct `editorId` per instance when multiple canvases can exist. Persistence is opt-in via `syncConfig`.

## Read only what the task needs

After choosing a framework, open the corresponding file under `./references/<framework>/`:

| Task | Reference |
| --- | --- |
| Install, editor vs. engine, sizing, refs | `setup.md` |
| Add, update, select, group or query objects | `objects.md` |
| Pan, zoom, coordinates or boundaries | `viewport.md` |
| Tools and toolbar | `tools-and-toolbar.md` |
| Ready and change events | `events.md` |
| Workspaces, persistence and collaboration | `workspaces-and-persistence.md` |
| Themes and context menus | `theming-and-context-menus.md` |
| End-to-end examples | `recipes.md` |

For current component props, methods, and events, consult [the generated API reference](./references/api.md); for object and provider APIs, use package types and the framework references. After implementation, run the application's typecheck or build and verify that the canvas has a visible size and reaches its ready event.