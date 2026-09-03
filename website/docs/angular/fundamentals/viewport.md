---
sidebar_label: Viewport
displayed_sidebar: tutorialSidebar
title: "Viewport Concept | Kritzel for Angular"
description: "Understand the core concept of Viewport in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Viewport

## Overview

In Kritzel, the "Viewport" represents the visible area of the canvas. Because Kritzel supports an infinite canvas structure, users need to pan and zoom to navigate different areas of their drawing. 

The Viewport API allows you to programmatically control the camera, read the current viewer state, and map coordinates between the device screen and the virtual canvas world.

## Changing the Viewport

You can programmatically set the viewport's pan and zoom using the `setViewport` method, or use animated transitions via `panTo` and `zoomTo`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/viewport/change"
  repoFiles={['src/app/pages/fundamentals/viewport/viewport-change.component.ts']}
/>

## Centering Content

Kritzel provides built-in methods to quickly navigate back to the content. You can center individual objects using `centerObjectInViewport`, or reset the camera to view all currently drawn content via `backToContent`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/viewport/center"
  repoFiles={['src/app/pages/fundamentals/viewport/viewport-center.component.ts']}
/>

## Coordinate Mapping

When interacting with the canvas directly or building custom overlays, you often need to convert between screen coordinates (pixels relative to the browser window or container) and world coordinates (the internal coordinate system of the drawing). 

Use `screenToWorld` and `worldToScreen` to bridge this gap.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/viewport/coordinates"
  repoFiles={['src/app/pages/fundamentals/viewport/viewport-coordinates.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Viewport & Navigation](../api-reference/editor.md#viewport--navigation)

