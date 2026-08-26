---
sidebar_label: Quick Start
title: "Quick Start | Kritzel for Vue"
description: "Install and integrate the Kritzel infinite canvas into your Vue application in minutes."
keywords:
  - vue whiteboard
  - vue infinite canvas
  - kritzel
---

import LiveDemo from '@site/src/components/LiveDemo';

# Quick Start

The following guide gets you a full Kritzel editor setup in under five minutes.

## Installation

```bash
npm install kritzel-vue
```

## Setup

Render Kritzel in your component:

```html title="Editor.vue"
<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
</script>

<template>
  <KritzelEditor style="display: block; width: 100%; height: 100vh" />
</template>
```

This renders the editor with the **full default toolbar**: selection, brush, eraser, line, shape, text, and image tools.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/getting-started"
  repoFiles={['src/pages/getting-started/QuickstartPage.vue']}
/>

## Optional Enhancements

### Persist Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

For provider behavior details and persistence guidance, see the [Persistence concept](../fundamentals/persistence.md).

```html title="Editor.vue"
<script setup lang="ts">
import { KritzelEditor, IndexedDBSyncProvider } from 'kritzel-vue'

const syncConfig = {
  providers: [IndexedDBSyncProvider],
}
</script>

<template>
  <KritzelEditor :syncConfig="syncConfig" style="display: block; width: 100%; height: 100vh" />
</template>
```

### Apply Full Viewport Styling

To ensure the Kritzel editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet, for example `styles.css`:

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

For optimal rendering and responsiveness on mobile devices, add this meta tag within the `head` section of your `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Vue App</title>
    <base href="/">
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```