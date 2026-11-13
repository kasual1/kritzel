# Updraw Editor for Vue

Build infinite canvas and collaborative whiteboard experiences in Vue with Updraw's native wrapper and TypeScript-first API.

Updraw is a framework-agnostic infinite canvas and collaborative whiteboard engine. It provides web components that work natively in any framework, with a first-class Vue wrapper for idiomatic template integration.

Updraw handles the hard parts of canvas-based applications — infinite pan and zoom, hit-testing, CRDT-based collaboration, undo and redo, and cross-browser rendering — so you can focus on your product's domain logic.

**Full documentation:** [updraw.io/docs/vue/getting-started/quick-start](https://updraw.io/docs/vue/getting-started/quick-start)

## Installation

```bash
npm install @updraw/vue-editor
```

## Setup

Render Updraw in your component:

```html
<script setup lang="ts">
import { UpdrawEditor } from '@updraw/vue-editor'
</script>

<template>
  <UpdrawEditor style="display: block; width: 100%; height: 100vh" />
</template>
```

This renders the editor with the **full default toolbar**: selection, brush, eraser, line, shape, text, and image tools.

## Optional Enhancements

### Persist Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

```html
<script setup lang="ts">
import { UpdrawEditor, IndexedDBSyncProvider } from '@updraw/vue-editor'

const syncConfig = {
  providers: [IndexedDBSyncProvider],
}
</script>

<template>
  <UpdrawEditor :syncConfig="syncConfig" style="display: block; width: 100%; height: 100vh" />
</template>
```

### Apply Full Viewport Styling

To ensure the Updraw editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g. `styles.css`):

```css
html,
body,
#app {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

### Include Mobile Viewport Meta Tag

For optimal rendering and responsiveness on mobile devices, add this meta tag within the `<head>` section of your `index.html`:

```html
<meta
  name="viewport"
  content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content"
/>
```

## Fundamentals

Updraw is composed of a small set of core concepts that work together to power your canvas experience:

- **[Components](https://updraw.io/docs/vue/getting-started/basic-usage)** — Two entry points, a batteries-included editor and a headless engine, to match any integration style.
- **[Tools](https://updraw.io/docs/vue/fundamentals/tools)** — State-machine interaction handlers that define how users draw, select, and manipulate the canvas.
- **[Objects](https://updraw.io/docs/vue/fundamentals/objects)** — The visual building blocks on the canvas, such as paths, shapes, text, and images with shared spatial properties.
- **[Workspaces](https://updraw.io/docs/vue/fundamentals/workspaces)** — Containers that manage an entire canvas collection, view state, and editor configuration.
- **[Theming](https://updraw.io/docs/vue/customization/themes)** — Built-in light and dark themes with full CSS variable customization to match your brand.
- **[Collaboration](https://updraw.io/docs/vue/advanced/collaboration)** — Real-time multi-user sync powered by Yjs CRDTs with pluggable transport providers.

Learn more in the [full documentation](https://updraw.io/docs/vue/getting-started/basic-usage).

## License

Updraw is released under the [MIT License](./LICENSE.md).
