---
sidebar_label: Viewport Navigation
displayed_sidebar: tutorialSidebar
title: "Viewport Navigation Example | Kritzel for Angular"
description: "Control the editor viewport programmatically — from a zoom status bar through object-focused navigation to a bounded presentation canvas."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Viewport Control & Navigation

This page demonstrates how to control the Kritzel viewport programmatically. Each example solves a different navigation scenario: displaying zoom state, focusing on objects, converting coordinates, and constraining the scrollable area.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How the Viewport Works

The viewport is described by `KritzelViewportState`:

```ts
interface KritzelViewportState {
  translateX: number; // current pan offset in world units (X axis)
  translateY: number; // current pan offset in world units (Y axis)
  scale: number;      // current zoom level (1 = 100 %)
  width: number;      // viewport width in pixels
  height: number;     // viewport height in pixels
}
```

All navigation methods — `panTo`, `zoomTo`, `setViewport`, `centerObjectInViewport` — work in **world coordinates**. The helpers `screenToWorld` and `worldToScreen` convert between the two coordinate spaces whenever your UI needs to bridge them. The `viewportChange` event fires after every pan or zoom, carrying the updated `KritzelViewportState`.

---

## Zoom Status Bar with Reset Controls

A status bar at the bottom of the editor that live-tracks the current viewport state and offers one-click buttons to reset zoom or return to the origin — the kind of chrome you'd find in a map editor or diagramming tool.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/viewport-navigation-zoom-dashboard"
  repoFiles={['src/app/examples/viewport-navigation/viewport-navigation-zoom-dashboard.component.ts']}
/>

The `viewportChange` event fires after every pan or zoom interaction and after any programmatic navigation call. `zoomTo(scale)` changes the zoom level without moving the pan position, while `setViewport(x, y, scale)` atomically sets both pan and zoom in one call — use it when restoring a saved viewport snapshot or jumping to a bookmark.

---

## Object Focus Navigator

A navigation bar that lets users jump the viewport directly to a selected object. Select any object on the canvas, then click "Focus Selected" to centre it in the viewport. The "Go to Origin" button pans back to world coordinate `(0, 0)` — useful for editors where users draw off-screen and need a quick way home.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/viewport-navigation-object-focus"
  repoFiles={['src/app/examples/viewport-navigation/viewport-navigation-object-focus.component.ts']}
/>

`centerObjectInViewport` pans and zooms so that the object fills an appropriate portion of the viewport — you don't need to know the object's position; the engine calculates the target from its bounding box. `panTo(x, y)` centres the viewport on the given world coordinates without altering the current zoom level.

---

## Presentation Mode with Bounded Canvas

A kiosk or presentation setup where the canvas is restricted to a fixed area. Users can freely pan and zoom within the bounds, but can never scroll outside the defined rectangle — ideal for slideshow views, guided tutorials, or digital signage.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/viewport-navigation-bounded-canvas"
  repoFiles={['src/app/examples/viewport-navigation/viewport-navigation-bounded-canvas.component.ts']}
/>

The four boundary inputs (`viewportBoundaryLeft`, `viewportBoundaryRight`, `viewportBoundaryTop`, `viewportBoundaryBottom`) define a rectangle in world coordinates that the viewport centre cannot leave. By default all four are `Infinity`, meaning no restriction. Setting finite values prevents the user from panning outside the defined area while still allowing free zooming.

---

## Click-to-Zoom Inspector

An inspection tool that converts a click on the canvas into world coordinates and zooms 2× at that exact spot — the workflow behind a map magnifier or a detail inspection mode. Click anywhere on the canvas to zoom in; use "Reset View" to return to the default state.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/viewport-navigation-click-to-zoom"
  repoFiles={['src/app/examples/viewport-navigation/viewport-navigation-click-to-zoom.component.ts']}
/>

`screenToWorld` expects coordinates **relative to the editor element**, not the browser window — subtract the element's bounding rect before passing the values. The returned world point is then passed to `zoomTo` as the zoom anchor, so the clicked spot stays fixed as the canvas scales in.
