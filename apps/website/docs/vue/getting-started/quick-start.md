---
sidebar_label: Quick Start
title: "Quick Start | Upmade for Vue"
description: "Install and integrate the Upmade infinite canvas into your Vue application in minutes."
keywords:
  - vue whiteboard
  - vue infinite canvas
  - upmade
toc_max_heading_level: 2
---

import LiveDemo from '@site/src/components/LiveDemo';
import SkillInstallation from '@site/src/components/SkillInstallation';

# Quick Start

The following guide gets you a full Upmade editor setup in under five minutes.

## Installation

Run the following command to install the Upmade editor in your project.

```bash
npm install @upmade/vue-editor
```

<SkillInstallation>

Install the related Upmade skill for coding assistance:

```bash
npx skills add kasual1/kritzel
```

</SkillInstallation>

## Setup

Render Upmade in your component:

```html title="Editor.vue"
<script setup lang="ts">
import { UpmadeEditor } from '@upmade/vue-editor'
</script>

<template>
  <UpmadeEditor style="display: block; width: 100%; height: 100vh" />
</template>
```

This renders the editor with all the default UI elements such as the toolbar, the workspace manager, the more menu, and the zoom control panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/getting-started/quick-start"
  repoFiles={['src/pages/getting-started/QuickStartPage.vue']}
/>

## Optional Enhancements

### Persisting Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

For provider behavior details and persistence guidance, take a look at [Persistence](../fundamentals/persistence.md).

```html title="Editor.vue"
<script setup lang="ts">
import { IndexedDBSyncProvider, UpmadeEditor, type UpmadeSyncConfig } from '@upmade/vue-editor'

const syncConfig: UpmadeSyncConfig = {
  providers: [IndexedDBSyncProvider],
}
</script>

<template>
  <UpmadeEditor :syncConfig="syncConfig" style="display: block; width: 100%; height: 100vh" />
</template>
```

### Full Viewport Styling

To ensure the Upmade editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet, for example `styles.css`:

```css
html,
body,
#app {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: block;
}
```

### Mobile Viewport Meta Tag

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