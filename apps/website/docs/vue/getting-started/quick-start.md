---
sidebar_label: Quick Start
title: "Quick Start | Updraw for Vue"
description: "Install and integrate the Updraw infinite canvas into your Vue application in minutes."
keywords:
  - vue whiteboard
  - vue infinite canvas
  - updraw
toc_max_heading_level: 2
---

import LiveDemo from '@site/src/components/LiveDemo';
import SkillInstallation from '@site/src/components/SkillInstallation';

# Quick Start

The following guide gets you a full Updraw editor setup in under five minutes.

## Installation

Run the following command to install the Updraw editor in your project.

```bash
npm install @updraw/vue-editor
```

<SkillInstallation>

Install the related Updraw skill for coding assistance:

```bash
npx skills add kasual1/kritzel
```

</SkillInstallation>

## Setup

Render Updraw in your component:

```html title="Editor.vue"
<script setup lang="ts">
import { UpdrawEditor } from '@updraw/vue-editor'
</script>

<template>
  <UpdrawEditor style="display: block; width: 100%; height: 100vh" />
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
import { IndexedDBSyncProvider, UpdrawEditor, type UpdrawSyncConfig } from '@updraw/vue-editor'

const syncConfig: UpdrawSyncConfig = {
  providers: [IndexedDBSyncProvider],
}
</script>

<template>
  <UpdrawEditor :syncConfig="syncConfig" style="display: block; width: 100%; height: 100vh" />
</template>
```

### Full Viewport Styling

To ensure the Updraw editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet, for example `styles.css`:

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