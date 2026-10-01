# Kritzel Engine for React

Build infinite canvas and collaborative whiteboard experiences in React with Kritzel's native wrapper and TypeScript-first API.

Kritzel is a framework-agnostic infinite canvas and collaborative whiteboard engine. It provides web components that work natively in any framework, with a first-class React wrapper for idiomatic JSX integration.

Kritzel handles the hard parts of canvas-based applications — infinite pan and zoom, hit-testing, CRDT-based collaboration, undo and redo, and cross-browser rendering — so you can focus on your product's domain logic.

**Full documentation:** [kritzel.io/docs/react/getting-started/quick-start](https://kritzel.io/docs/react/getting-started/quick-start)

## Installation

```bash
npm install @kritzel/react-engine
```

## Setup

Render Kritzel in your component:

```tsx
import { KritzelEngine } from '@kritzel/react-engine';

export function Editor() {
  return <KritzelEngine style={{ display: 'block', width: '100%', height: '100vh' }} />;
}
```

This renders the lower-level engine canvas without the editor toolbar shell.

## Optional Enhancements

### Persist Canvas State

By default, the engine uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

```tsx
import { KritzelEngine, IndexedDBSyncProvider } from '@kritzel/react-engine';

export function Editor() {
  const syncConfig = {
    providers: [IndexedDBSyncProvider],
  };

  return (
    <KritzelEngine
      syncConfig={syncConfig}
      style={{ display: 'block', width: '100%', height: '100vh' }}
    />
  );
}
```

### Apply Full Viewport Styling

To ensure the Kritzel engine occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g. `styles.css`):

```css
html,
body,
#root {
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

Kritzel is composed of a small set of core concepts that work together to power your canvas experience:

- **[Components](https://kritzel.io/docs/react/getting-started/basic-usage)** — Two entry points, a batteries-included editor and a headless engine, to match any integration style.
- **[Tools](https://kritzel.io/docs/react/fundamentals/tools)** — State-machine interaction handlers that define how users draw, select, and manipulate the canvas.
- **[Objects](https://kritzel.io/docs/react/fundamentals/objects)** — The visual building blocks on the canvas, such as paths, shapes, text, and images with shared spatial properties.
- **[Workspaces](https://kritzel.io/docs/react/fundamentals/workspaces)** — Containers that manage an entire canvas collection, view state, and editor configuration.
- **[Theming](https://kritzel.io/docs/react/customization/themes)** — Built-in light and dark themes with full CSS variable customization to match your brand.
- **[Collaboration](https://kritzel.io/docs/react/advanced/collaboration)** — Real-time multi-user sync powered by Yjs CRDTs with pluggable transport providers.

Learn more in the [full documentation](https://kritzel.io/docs/react/getting-started/basic-usage).

## License

See the [Kritzel License](https://kritzel.io/license). Kritzel is free for personal, hobby, and educational use. Commercial use requires a license — visit [kritzel.io](https://kritzel.io) for details.
