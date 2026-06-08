---
sidebar_label: Slideshow Presentation
displayed_sidebar: tutorialSidebar
title: "Slideshow Presentation Example | Kritzel for Angular"
description: "Build a beautiful slideshow presentation layout on an infinite canvas with horizontal slide guides and dynamic slide boundaries."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Slideshow Presentation

This page demonstrates how to build and control a horizontal presentation slideshow layout on top of the infinite canvas. By positioning slide templates across different world coordinates and restricting camera margins, users can navigate cleanly between slides with bounded viewports.

## Prerequisites

Complete the [Quick Start](quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Slideshow Presentations Work

A slideshow presentation layout leverages horizontal coordinate tracks to position slides at spaced absolute offsets:

```ts
interface Slide {
  title: string;
  centerX: number;
  centerY: number;
}
```

By setting `viewportBoundaryLeft`, `viewportBoundaryRight`, `viewportBoundaryTop`, and `viewportBoundaryBottom` inputs dynamically per slide, we lock the camera strictly to a boundary defined slightly larger than the slide itself (e.g., boundaries allowed at $\pm 600$ horizontal and $\pm 400$ vertical offsets around the slide center). 

Using a slightly zoomed-out viewport scale of `0.85`, each presentation slide is rendered alongside a clean external margin frame within the active viewer space instead of completely filling the screen. This allows delegates to see slide edges and maintain visual reference.

---

## Horizontal Slide Decks with Bounded Navigation

A curated slides deck with an interactive Angular dashboard header. Clicking next or previous triggers viewport pan transitions while clamping camera coordinates inside active slide margins.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/slideshow-presentation"
  repoFiles={['src/app/examples/slideshow-presentation/slideshow-presentation.component.ts']}
/>
