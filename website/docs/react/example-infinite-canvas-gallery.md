---
sidebar_label: Infinite Canvas Gallery
displayed_sidebar: tutorialSidebar
title: "Infinite Canvas Gallery Example | Kritzel for Angular"
description: "Build an infinite canvas art gallery with 20 scattered artworks that visitors can freely pan and zoom to explore."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Infinite Canvas Gallery

This page demonstrates how to use `<KritzelEditor>` as a read-only infinite canvas for displaying scattered visual content. Inspired by infinite-canvas art experiences, each artwork is placed at an arbitrary coordinate across a large 2D world. Visitors can pan freely and scroll to zoom in on individual pieces without any drawing or editing tools in the way.

## Prerequisites

Complete the [Quick Start](quick-start.md) guide to have a working `<KritzelEditor>` rendered in your application. This example builds on that setup.

---

## How the Gallery Canvas Works

Artworks are plain `KritzelImage` objects loaded from external URLs and placed at absolute world-space coordinates. They are marked non-editable so visitors cannot accidentally move or resize them:

```ts
const img = await KritzelImage.fromUrl(src, {
  translateX: art.x,
  translateY: art.y,
  maxWidth: art.w,
  maxHeight: art.h,
});
img.isEditable = false;
await editor.addObject(img);
```

The entire gallery is seeded once inside `onReady()` — after checking that no objects already exist — then the viewport is set to a zoomed-out overview with `setViewport(0, 0, 0.25)` so visitors immediately see the scattered layout.

The toolbar is reduced to the selection tool only, keeping the UI minimal and the canvas feeling open:

```ts
controls: KritzelToolbarControl[] = [
  { name: 'selection', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
];
```

---

## Scattered Artwork Gallery

Twenty artwork thumbnails — sourced from [placehold.co](https://placehold.co) as dummy images — are placed in loose clusters across a ~4000 × 2700 world-space canvas. Visitors pan to travel between clusters and scroll to zoom into individual pieces.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/infinite-canvas-gallery"
  repoFiles={['src/app/examples/infinite-canvas-gallery/infinite-canvas-gallery.component.ts']}
/>

The key detail: `maxWidth` and `maxHeight` on each `KritzelImage.fromUrl` call must match the intended display size. The default constraints are `300 × 300`, so images larger than that are silently scaled down unless overridden.
