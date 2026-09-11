---
sidebar_label: Quick Start
title: "Quick Start | Kritzel for React"
description: "Install and integrate the Kritzel infinite canvas into your React application in minutes."
keywords:
  - react whiteboard
  - react infinite canvas
  - kritzel
toc_max_heading_level: 2
---

import LiveDemo from '@site/src/components/LiveDemo';

# Quick Start

The following guide gets you a full Kritzel editor setup in under five minutes.

## Installation

```bash
npm install kritzel-react
```

## Setup

Render Kritzel in your component:

```tsx title="Editor.tsx"
import { KritzelEditor } from 'kritzel-react';

export function Editor() {
  return <KritzelEditor style={{ display: 'block', width: '100%', height: '100vh' }} />;
}
```

This renders the editor with the **full default toolbar**: selection, brush, eraser, line, shape, text, and image tools.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/getting-started/quick-start"
  repoFiles={['src/pages/getting-started/QuickStartPage.tsx']}
/>

## Optional Enhancements

### Persist Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

For provider behavior details and persistence guidance, see the [Persistence concept](../fundamentals/persistence.md).

```tsx title="Editor.tsx"
import { KritzelEditor, IndexedDBSyncProvider } from 'kritzel-react';

export function Editor() {
  const syncConfig = {
    providers: [IndexedDBSyncProvider],
  };

  return (
    <KritzelEditor
      syncConfig={syncConfig}
      style={{ display: 'block', width: '100%', height: '100vh' }}
    />
  );
}
```

### Apply Full Viewport Styling

To ensure the Kritzel editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet, for example `styles.css`:

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

For optimal rendering and responsiveness on mobile devices, add this meta tag within the `head` section of your `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>React App</title>
    <base href="/">
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```