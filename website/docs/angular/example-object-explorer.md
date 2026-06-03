---
sidebar_label: Object Explorer
displayed_sidebar: tutorialSidebar
title: "Object Explorer Example | Kritzel for Angular"
description: "Build a structured tree-based object explorer with filtering, visibility toggles, and a live inspector for canvas objects."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Object Explorer

This page demonstrates how to build a full object explorer experience on top of Kritzel, including hierarchical group navigation, multi-criteria filtering, object creation actions, and direct property editing in a live inspector.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Object Explorer Works

A tree-based explorer tracks all canvas objects and derives root-level entries by subtracting group child IDs from the full object list:

```ts
interface ObjectExplorerFilters {
  searchQuery: string;
  selectedTypes: Set<string>;
  visibility: 'all' | 'visible' | 'hidden';
}
```

When combined with `objectsAdded`, `objectsUpdated`, and `objectsRemoved`, the side panel always reflects the live editor state. Selecting an entry can pan and select the corresponding object on canvas, while inspector controls call `updateObject()` to apply partial updates in real time.

---

## Hierarchical Canvas Explorer with Live Inspector

A presentation-style explorer layout with a dashboard header, grouped tree navigation, and an inline inspector for updating coordinates, dimensions, text, fill colors, and visibility behavior.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-explorer"
  repoFiles={['src/app/examples/object-explorer/object-explorer.component.ts']}
/>
