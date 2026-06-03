---
sidebar_label: Canvas Map Presentation
displayed_sidebar: tutorialSidebar
title: "Canvas Map Presentation Example | Kritzel for Angular"
description: "Build a non-linear Prezi-style presentation deck featuring coordinate-based navigation and smooth single-step zoom transitions."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Canvas Map Presentation

This page demonstrates how to build an immersive, non-linear presentation deck similar to Prezi. Instead of laying out slide templates horizontally, slides are placed across arbitrary coordinates on an infinite 2D canvas. Navigating between slides triggers a smooth cinematic pan and zoom animation to focus on successive slides, while keeping the infinite canvas completely open and free-form.

## Prerequisites

Complete the [Quick Start](website/docs/angular/quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Canvas Map Presentations Work

A non-linear canvas map presentation uses coordinate nodes positioned freely in 2D space:

```ts
interface Slide {
  title: string;
  centerX: number;
  centerY: number;
}
```

Since the canvas is completely unconstrained, users can freely pan, scroll, and drag to draw ideas, annotate, or navigate around the entire editor space whenever they like. Clicking Next or Previous triggers a single fluid programmatical viewport pan and zoom transition targeting the slide coordinates:

1. Glide over to the designated target slide `centerX` and `centerY`.
2. Apply the presentation scale of `0.85` so the slide frames fit perfectly within the viewer pane with comfortable surrounding margins.

---

## Non-Linear Slide Decks with Smooth Viewport Transitions

A presentation layout showcasing direct diagonal transitions and fluid single-step pan and zoom animations with entirely open viewer travel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/canvas-map-presentation"
  repoFiles={['src/app/examples/canvas-map-presentation/canvas-map-presentation.component.ts']}
/>

