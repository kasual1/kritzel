---
sidebar_label: Viewport
displayed_sidebar: tutorialSidebar
title: "Viewport Concept | Kritzel for React"
description: "Understand the core concept of Viewport in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Viewport

## Overview

In Kritzel, the Viewport represents the visible area of the canvas. Because Kritzel supports potentially infinite or bounded canvas structures, users need to pan and zoom to navigate different areas of their drawing.

The Viewport API allows you to programmatically control the camera, read the current viewer state, and map coordinates between the device screen and the virtual canvas world.

## Changing the Viewport

You can programmatically set the viewport pan and zoom using `setViewport`, or use animated transitions via `panTo` and `zoomTo`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/viewport-change"
  repoFiles={['src/pages/fundamentals/viewport/viewport-change.tsx']}
/>

## Centering Content

Kritzel provides built-in methods to quickly navigate back to content. You can center individual objects using `centerObjectInViewport`, or reset the camera to view all currently drawn content via `backToContent`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/viewport-center"
  repoFiles={['src/pages/fundamentals/viewport/viewport-center.tsx']}
/>

## Coordinate Mapping

When interacting with the canvas directly or building custom overlays, you often need to convert between screen coordinates (pixels relative to the browser window or container) and world coordinates (the internal coordinate system of the drawing).

Use `screenToWorld` and `worldToScreen` to bridge this gap.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/viewport-coordinates"
  repoFiles={['src/pages/fundamentals/viewport/viewport-coordinates.tsx']}
/>

## Related API Methods

The following methods are available on the Editor and Engine components for managing the viewport:

- State reading (`getViewport()`)
- Camera control (`setViewport()`, `panTo()`, `zoomTo()`)
- Content centering (`centerObjectInViewport()`, `backToContent()`)
- Coordinate mapping (`screenToWorld()`, `worldToScreen()`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).