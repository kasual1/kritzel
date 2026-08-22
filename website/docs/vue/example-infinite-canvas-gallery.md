---
sidebar_label: Infinite Canvas Gallery
displayed_sidebar: tutorialSidebar
title: "Infinite Canvas Gallery Example | Kritzel for Vue"
description: "Build an infinite canvas art gallery with 20 scattered artworks that visitors can freely pan and zoom to explore."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Infinite Canvas Gallery

This page demonstrates how to use `<KritzelEditor>` as a read-only infinite canvas for displaying scattered visual content. Inspired by infinite-canvas art experiences, each artwork is placed at an arbitrary coordinate across a large 2D world. Visitors can pan freely and scroll to zoom in on individual pieces without any drawing or editing tools in the way.

## Prerequisites

Complete the [Quick Start](quick-start.md) guide to have a working `<KritzelEditor>` rendered in your application. This example builds on that setup.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Objects](/docs/vue/concept-objects) - loading images with `KritzelImage.fromUrl()` and placing them at world-space coordinates
- [Viewport](/docs/vue/concept-viewport) - setting an initial zoomed-out overview with `setViewport()`
- [Tools](/docs/vue/concept-tools) - reducing the toolbar to a single selection tool for a read-only experience
- [Components](/docs/vue/components/concept-editor) - configuring the editor for a non-editable presentation mode

---

## Scattered Artwork Gallery

Twenty artwork thumbnails — sourced from [placehold.co](https://placehold.co) as dummy images — are placed in loose clusters across a ~4000 × 2700 world-space canvas. Visitors pan to travel between clusters and scroll to zoom into individual pieces.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/examples/infinite-canvas-gallery"
  repoFiles={['src/pages/examples/infinite-canvas-gallery/InfiniteCanvasGalleryPage.vue']}
/>

The key detail: `maxWidth` and `maxHeight` on each `KritzelImage.fromUrl` call must match the intended display size. The default constraints are `300 × 300`, so images larger than that are silently scaled down unless overridden.
