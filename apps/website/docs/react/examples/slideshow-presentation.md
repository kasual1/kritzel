---
sidebar_label: Slideshow Presentation
displayed_sidebar: tutorialSidebar
title: "Slideshow Presentation Example | Kritzel for React"
description: "Build a beautiful slideshow presentation layout on an infinite canvas with horizontal slide guides and dynamic slide boundaries."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Slideshow Presentation

This page demonstrates how to build and control a horizontal presentation slideshow on the infinite canvas. Slide templates live at different world coordinates, while external React controls move the camera between their centers.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to have a working `<KritzelEditor>` rendered in your application. This example builds on that setup.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Viewport](/docs/react/fundamentals/viewport) - programmatically panning and zooming the camera to center on specific world coordinates
- [Controls](/docs/react/fundamentals/controls) - driving the editor from external React controls
- [Objects](/docs/react/fundamentals/objects) - seeding shape objects at absolute world-space positions to act as slide templates

---

## Horizontal Slide Decks with Bounded Navigation

A curated slide deck with an interactive dashboard header. Clicking next or previous updates the current slide in React state and moves the viewport to that slide's world-space center.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/slideshow-presentation"
  repoFiles={['src/pages/examples/SlideshowPresentationPage.tsx']}
/>

Slides are positioned at evenly spaced horizontal offsets and seeded as `KritzelShape` and `KritzelText` objects from `onIsReady`. Before seeding, the page checks `getAllObjects()` so development remounts do not duplicate the deck. Navigating calls `setViewport(centerX, centerY, scale)` through a typed editor ref.

The built-in toolbar, menus, panning, and wheel zoom are disabled so the external Previous and Next buttons remain the authoritative navigation controls.
