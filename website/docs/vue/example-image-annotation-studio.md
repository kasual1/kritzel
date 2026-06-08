---
sidebar_label: Image Annotation Studio
displayed_sidebar: tutorialSidebar
title: "Image Annotation Studio Example | Kritzel for Angular"
description: "Build an annotation surface with a centered image and a custom external toolbar with color swatches and sketch or text modes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Image Annotation Studio

This example demonstrates a focused image annotation experience built with Kritzel. It centers a background image on the canvas and exposes a custom bottom toolbar with clickable color circles for sketching plus a mode switch for sketch and text.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to get a working Kritzel editor in your Angular app.

---

## How Image Annotation Works

The implementation combines three key ideas:

1. Register multiple brush tools, each with a fixed color, then activate them from external UI buttons.
2. Seed a centered background image once in `onReady()` so every session starts with the same visual anchor.
3. Keep the image non-interactive with `pointer-events: none` so annotations always remain the primary interaction.

This pattern is useful when you want Kritzel drawing power with a fully custom product UI instead of built-in controls.

---

## Screenshot-Style Annotation Canvas with External Color Tools

This scenario mirrors a media review flow: users select a color swatch, sketch directly over the image, or switch to text mode for callouts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/image-annotation-studio"
  repoFiles={['src/app/examples/image-annotation-studio/image-annotation-studio.component.ts']}
/>

The custom toolbar drives editor behavior through `changeActiveToolByName(...)`, while Kritzel handles object creation, persistence, and viewport interaction behind the scenes.
