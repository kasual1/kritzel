---
title: "Quick Start | Kritzel for Vue"
description: "Install and integrate the Kritzel infinite canvas into your Vue application in minutes."
---
# Getting Started

## Installation

```bash
npm install kritzel-vue
```

## Quick Start

Register the component library in your app entry point:

```ts
// main.ts
import { createApp } from 'vue';
import { ComponentLibrary } from 'kritzel-vue';
import App from './App.vue';

createApp(App).use(ComponentLibrary).mount('#app');
```

Then use the component in your template:

```html
<!-- App.vue -->
<template>
  <kritzel-editor></kritzel-editor>
</template>
```

## Optional Enhancements

### Apply Full Viewport Styling

To ensure the Kritzel editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g., `style.css`):

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
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
    <title>Vite + Vue + TS</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```
