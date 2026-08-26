---
sidebar_label: Image Annotation Studio
displayed_sidebar: tutorialSidebar
title: "Image Annotation Studio Example | Kritzel for Vue"
description: "Build an annotation surface with a centered image and a custom external toolbar with color swatches and sketch or text modes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Image Annotation Studio

This example demonstrates a focused image annotation experience built with Kritzel. It centers a background image on the canvas and exposes a custom bottom toolbar with clickable color circles for sketching plus a mode switch for sketch and text.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to get a working Kritzel editor in your Vue app.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Tools](/docs/vue/fundamentals/tools) - registering multiple brush tools with fixed colors and switching between them programmatically
- [Objects](/docs/vue/fundamentals/objects) - seeding a centered background image as non-interactive scenery
- [Components](/docs/vue/fundamentals/components/editor) - driving editor behavior from a custom external toolbar via `changeActiveToolByName()`

---

## Screenshot-Style Annotation Canvas with External Color Tools

Users pick a color from a row of circular swatches in a custom bottom toolbar, then sketch freehand annotations directly over the image. A mode toggle switches between brush drawing and text placement for callouts. The built-in editor toolbar are hidden - all interaction flows through the external toolbar.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/examples/image-annotation-studio"
  repoFiles={['src/pages/examples/image-annotation-studio/ImageAnnotationStudioPage.vue']}
/>

The background image is loaded once in `onReady()` using `KritzelImage.fromUrl()` and centered on the canvas. It is marked non-editable with `isEditable = false` so annotations always remain the primary interaction layer. Each color swatch registers a separate brush tool with a fixed stroke color, and clicking a swatch calls `changeActiveToolByName(...)` to activate the corresponding tool without any built-in UI involvement.
