---
sidebar_label: Object Explorer
displayed_sidebar: tutorialSidebar
title: "Object Explorer Example | Kritzel for Vue"
description: "Build a structured tree-based object explorer with filtering, visibility toggles, and a live inspector for canvas objects."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Object Explorer

This page demonstrates how to build a full object explorer experience on top of the Kritzel library, including hierarchical group navigation, multi-criteria filtering, object creation actions, and direct property editing in a live inspector.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to have a working `<KritzelEditor>` rendered in your application. This example builds on that setup.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Objects](/docs/vue/fundamentals/objects) - querying, updating, and removing canvas objects programmatically
- [Editor API Reference](/docs/vue/api-reference/editor) - listening to `objectsAdded`, `objectsUpdated`, and `objectsRemoved` events to keep external UI in sync
- [Viewport](/docs/vue/fundamentals/viewport) - panning and zooming to focus on a selected object

---

## Hierarchical Canvas Explorer with Live Inspector

A presentation-style explorer layout with a dashboard header, grouped tree navigation, and an inline inspector for updating coordinates, dimensions, text, fill colors, and visibility behavior.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/examples/object-explorer"
  repoFiles={['src/pages/examples/ObjectExplorerPage.vue']}
/>

The object list is seeded in `onReady()` and kept in sync via the `objectsAdded`, `objectsRemoved`, and `objectsUpdated` event callbacks. Root objects are derived by filtering out any IDs that appear as children inside `KritzelGroup` objects. Selecting a tree node calls `updateObject()` to apply property changes from the inspector fields in real time.

Clicking a tree entry highlights the corresponding canvas object and pans the viewport to bring it into view using `setViewport()`. The tree supports expand/collapse for groups, text search across IDs and types, and type-based chip filters - all driven purely from the local signal state without additional API calls.
