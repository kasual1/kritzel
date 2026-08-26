---
sidebar_label: Blueprint Defect Mapper
displayed_sidebar: tutorialSidebar
title: "Interactive Blueprint & Defect Pin Mapper | Kritzel for Angular"
description: "Incorporate static architectural blueprints and allow facility inspectors to register defect pins onto custom vector layouts."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Interactive Blueprint & Defect Pin Mapper

This page walkthrough demonstrates how to build an interactive floor plan or blueprint inspector. Users can pan and zoom across a complex architectural background scenery image, witness outstanding facility issues, and click directly onto the blueprint to drop customized status-colored defect pins.

## Prerequisites

Before diving into this walkthrough, complete the [Quick Start](../getting-started/quick-start.md) guide to set up `<kritzel-editor>` in your Angular application.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Objects](/docs/angular/fundamentals/objects) — seeding background images and creating shape objects as defect markers
- [Viewport](/docs/angular/fundamentals/viewport) — converting screen coordinates to world coordinates with `screenToWorld()` and focusing the camera with `setViewport()`
- [Tools](/docs/angular/fundamentals/tools) — switching to the selection tool programmatically during pin placement mode
- [Components](/docs/angular/fundamentals/components/editor) — hiding built-in toolbar and driving all interactions from a custom sidebar

---

## Facilities Blueprint and Defect Monitor

The interactive workspace provides a pre-seeded Facilities blueprint image. Users can toggle "Defect Pin Placement Mode", click on the floor plan to drop brand-new outstanding issues, and monitor existing defects from the side inspector card. Clicking any row in the Reported Defects list automatically pans and focuses on that specific defect marker.

:::info Viewport Camera Centering vs Object Centering
In Kritzel, `centerObjectInViewport()` moves the **actual target object** under the hood to align with the viewport center. For static blueprints or stationary marker pins, calling `centerObjectInViewport()` would shift their positions on the canvas, drifting them off their physical location. 

Instead, to center the camera viewport on a static image background or a stationary pin without mutating its coordinates, use `setViewport(x, y, scale)` to seamlessly adjust the camera matrix.
:::

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/blueprint-defect-mapper"
  repoFiles={['src/app/examples/blueprint-defect-mapper/blueprint-defect-mapper.component.ts']}
/>

The background scenery is registered directly in `onReady()` when the canvas activates. Because we want user-drawn drawings or shapes to sit on top of the architectural drawing, the image scenery item is loaded and pushed first. The custom `pointer-events: none` property applied to the blueprint layer allows users to select manually added pins or draw arrows over the blueprint scenery without dragging the floorplan background by mistake.

To convert a standard mouse or pointer click into coordinate units, we measure the click relative to our `<kritzel-editor>` bounds and pass it to `screenToWorld(x, y)`. The resulting absolute coordinates act as the center pivot when constructing our customized circular `KritzelShape` pin objects on the canvas.
