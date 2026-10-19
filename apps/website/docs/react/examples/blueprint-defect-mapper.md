---
sidebar_label: Blueprint Defect Mapper
displayed_sidebar: tutorialSidebar
title: "Interactive Blueprint & Defect Pin Mapper | Kritzel for React"
description: "Incorporate static architectural blueprints and allow facility inspectors to register defect pins onto custom vector layouts."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Interactive Blueprint & Defect Pin Mapper

This page walkthrough demonstrates how to build an interactive floor plan or blueprint inspector. Users can pan and zoom across a complex architectural background scenery image, witness outstanding facility issues, and click directly onto the blueprint to drop customized status-colored defect pins.

## Prerequisites

Before diving into this walkthrough, complete the [Quick Start](../getting-started/quick-start.md) guide to set up `<KritzelEditor>` in your React application.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Objects](/docs/react/fundamentals/objects) - seeding background images and creating shape objects as defect markers
- [Viewport](/docs/react/fundamentals/viewport) - converting screen coordinates to world coordinates with `screenToWorld()` and focusing the camera with `setViewport()`
- [Tools](/docs/react/fundamentals/tools) - switching to the selection tool programmatically during pin placement mode
- [Controls](/docs/react/fundamentals/controls) - hiding built-in toolbar and driving all interactions from a custom sidebar

---

## Facilities Blueprint and Defect Monitor

The interactive workspace provides a pre-seeded Facilities blueprint image. Users can toggle "Defect Pin Placement Mode", click on the floor plan to drop brand-new outstanding issues, and monitor existing defects from the side inspector card. Clicking any row in the Reported Defects list automatically pans and focuses on that specific defect marker.

:::info Viewport Camera Centering vs Object Centering
In Kritzel, `centerObjectInViewport()` moves the **actual target object** under the hood to align with the viewport center. For static blueprints or stationary marker pins, calling `centerObjectInViewport()` would shift their positions on the canvas, drifting them off their physical location. 

Instead, to center the camera viewport on a static image background or a stationary pin without mutating its coordinates, use `setViewport(x, y, scale)` to seamlessly adjust the camera matrix.
:::

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/blueprint-defect-mapper"
  repoFiles={['src/pages/examples/BlueprintDefectMapperPage.tsx']}
/>

The background image is loaded through `KritzelImage.fromUrl()` the first time `onIsReady` runs, centered at the world origin, and inserted before the defect pins so markers remain above it. Existing canvas objects are checked before seeding, which keeps React development remounts from duplicating the floorplan.

To convert a click into canvas units, the page measures it relative to the `<KritzelEditor>` ref and passes the local coordinates to `screenToWorld(x, y)`. The returned world coordinates become the center point for a circular `KritzelShape`. Defect cards live in React state; status changes update both that state and the corresponding pin through `updateObject()`.
