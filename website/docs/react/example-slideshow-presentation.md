---
sidebar_label: Slideshow Presentation
displayed_sidebar: tutorialSidebar
title: "Slideshow Presentation Example | Kritzel for React"
description: "Build a beautiful slideshow presentation layout on an infinite canvas with horizontal slide guides and dynamic slide boundaries."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Slideshow Presentation

This page demonstrates how to build and control a horizontal presentation slideshow layout on top of the infinite canvas. By positioning slide templates across different world coordinates and restricting camera margins, users can navigate cleanly between slides with bounded viewports.

## Prerequisites

Complete the [Quick Start](quick-start.md) guide to have a working `<KritzelEditor>` rendered in your application. This example builds on that setup.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Viewport](/docs/react/concept-viewport) - programmatically panning and zooming the camera to center on specific world coordinates
- [Components](/docs/react/components/concept-editor) - configuring viewport boundary inputs to lock the camera within slide margins
- [Objects](/docs/react/concept-objects) - seeding shape objects at absolute world-space positions to act as slide templates

---

## Horizontal Slide Decks with Bounded Navigation

A curated slides deck with an interactive dashboard header. Clicking next or previous triggers viewport pan transitions while clamping camera coordinates inside active slide margins.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/examples/slideshow-presentation"
  repoFiles={['src/pages/examples/slideshow-presentation/SlideshowPresentationPage.tsx']}
/>

Slides are positioned at evenly spaced horizontal offsets and seeded as `KritzelShape` objects in `onReady()`. Navigating between slides calls `setViewport(centerX, centerY, scale)` to pan the camera to the target slide's coordinates. The viewport boundary inputs (`viewportBoundaryLeft`, `viewportBoundaryRight`, etc.) are updated dynamically per slide to clamp the camera within the active slide's margins.

The slightly zoomed-out scale of `0.85` ensures slide edges remain visible, giving users a visual frame of reference rather than a full-bleed view.
