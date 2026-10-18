---
sidebar_label: Image Annotation Studio
displayed_sidebar: tutorialSidebar
title: "Image Annotation Studio Example | Kritzel for React"
description: "Build an annotation surface with a centered image and a custom external toolbar with color swatches and sketch or text modes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Image Annotation Studio

This example demonstrates a focused image annotation experience built with Kritzel. It centers a background image on the canvas and exposes a custom bottom toolbar with clickable color circles for sketching plus a mode switch for sketch and text.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to get a working Kritzel editor in your React app.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Tools](/docs/react/fundamentals/tools) - registering multiple brush tools with fixed colors and switching between them programmatically
- [Objects](/docs/react/fundamentals/objects) - seeding a centered background image as non-interactive scenery
- [Tools](/docs/react/fundamentals/tools) - driving editor behavior from a custom external toolbar via `setActiveTool()`

---

## Screenshot-Style Annotation Canvas with External Color Tools

Users pick a color from circular swatches in a custom bottom toolbar, then sketch directly over the image. A segmented mode control switches between brush drawing and text placement, while separate icon controls expose undo, redo, and zoom. The built-in editor controls are hidden so all interaction flows through the React UI.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/image-annotation-studio"
  repoFiles={['src/pages/examples/ImageAnnotationStudioPage.tsx']}
/>

The background image is loaded from `onIsReady` with `KritzelImage.fromUrl()` and centered on the canvas. The page checks existing objects before insertion so the image is added only once. Each color swatch registers a brush tool with a fixed stroke color; clicking a swatch updates React state, synchronizes the text-tool color, and calls `setActiveTool(...)` through the editor ref.
