---
sidebar_label: Object Explorer
displayed_sidebar: tutorialSidebar
title: "Object Explorer Example | Kritzel for React"
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

- [Objects](/docs/react/fundamentals/objects) - querying, updating, and removing canvas objects programmatically
- [Editor API Reference](/docs/react/api-reference/editor) - listening to `objectsAdded`, `objectsUpdated`, and `objectsRemoved` events to keep external UI in sync
- [Viewport](/docs/react/fundamentals/viewport) - panning and zooming to focus on a selected object

---

## Hierarchical Canvas Explorer with Live Inspector

A presentation-style explorer layout with a dashboard header, grouped tree navigation, and an inline inspector for updating coordinates, dimensions, text, fill colors, and visibility behavior.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/object-explorer"
  repoFiles={['src/pages/examples/ObjectExplorerPage.tsx']}
/>

The object list is seeded from `onIsReady` and mirrored into React state through `onObjectsAdded`, `onObjectsRemoved`, and `onObjectsUpdated`. Each event payload is read from `event.detail`. Root objects are derived with `useMemo()` by filtering out IDs that appear as children inside `KritzelGroup` objects, while inspector edits call `updateObject()` through a typed editor ref.

Clicking a tree entry selects the corresponding canvas object and brings it into view with `panToObject()`. The tree supports expand/collapse for groups, text search across IDs and types, and type chips, all derived from local React state. A native `objectsSelectionChange` listener keeps the inspector synchronized with canvas selection and is removed in the effect cleanup.
