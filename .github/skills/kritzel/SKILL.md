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

## Use the demos as canonical examples

The runnable demos are the best reference for complete integrations. They use parallel routes across frameworks, so open the matching page for the framework being edited rather than translating wrapper syntax by guesswork:

- [Angular route registry](../../../apps/demos/angular/src/app/app.routes.ts) and [Angular pages](../../../apps/demos/angular/src/app/pages/)
- [React route registry](../../../apps/demos/react/src/demo-routes.ts) and [React pages](../../../apps/demos/react/src/pages/)
- [Vue route registry](../../../apps/demos/vue/src/demo-routes.ts) and [Vue pages](../../../apps/demos/vue/src/pages/)

Use these demo areas as good examples for the corresponding task:

| Task | Angular | React | Vue |
| --- | --- | --- | --- |
| Start an editor and seed objects | [Getting started](../../../apps/demos/angular/src/app/pages/getting-started/) | [Getting started](../../../apps/demos/react/src/pages/getting-started/) | [Getting started](../../../apps/demos/vue/src/pages/getting-started/) |
| Controls, objects, tools, viewport, workspaces and persistence | [Fundamentals](../../../apps/demos/angular/src/app/pages/fundamentals/) | [Fundamentals](../../../apps/demos/react/src/pages/fundamentals/) | [Fundamentals](../../../apps/demos/vue/src/pages/fundamentals/) |
| Collaboration, dynamic objects, import/export and user management | [Advanced](../../../apps/demos/angular/src/app/pages/advanced/) | [Advanced](../../../apps/demos/react/src/pages/advanced/) | [Advanced](../../../apps/demos/vue/src/pages/advanced/) |
| Themes, fonts, icons and localization | [Customization](../../../apps/demos/angular/src/app/pages/customization/) | [Customization](../../../apps/demos/react/src/pages/customization/) | [Customization](../../../apps/demos/vue/src/pages/customization/) |
| Complete product-style integrations | [Examples](../../../apps/demos/angular/src/app/pages/examples/) | [Examples](../../../apps/demos/react/src/pages/examples/) | [Examples](../../../apps/demos/vue/src/pages/examples/) |

In particular, start with `quick-start` or `basic-usage`, then compare the focused `objects`, `tools`, `viewport`, `persistence`, `theming`, and `localization` pages before implementing a new integration. The `examples` pages (`object-explorer`, `blueprint-defect-mapper`, `slideshow-presentation`, and `image-annotation-studio`) show how the editor can be composed into larger workflows.

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