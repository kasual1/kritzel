---
sidebar_label: Object Management
displayed_sidebar: tutorialSidebar
title: "Object Management Example | Kritzel for Angular"
description: "Programmatically list, select, mutate, remove, and filter canvas objects from custom UI panels."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Object Management

This page shows how to build custom UI that reads and controls canvas objects programmatically. Each example is a self-contained panel you can drop into your application.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Object Management Works

Every canvas object extends `KritzelBaseObject`, which exposes common properties such as `id`, `__class__`, `opacity`, `zIndex`, `isVisible`, `translateX`, `translateY`, `width`, and `height`. Subclasses like `KritzelShape`, `KritzelText`, and `KritzelPath` add type-specific properties on top.

The editor exposes three read methods — `getAllObjects()`, `findObjects(predicate)`, and `getObjectById(id)` — and three write methods — `addObject(object)`, `updateObject(object, partialProps)`, and `removeObject(object)`. The write methods each emit a corresponding output event (`objectsAdded`, `objectsUpdated`, `objectsRemoved`) carrying the affected objects. These same events fire when the user draws or erases objects interactively, so a single set of handlers covers all change sources. `selectObjects(objects)` switches to the selection tool and programmatically highlights the given objects.

---

## Read-Only Object Inspector

A sidebar that lists every object on the canvas and stays in sync automatically. Drawing or erasing updates the list in real time through the three change events without any polling or manual refresh.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-read-only-inspector"
  repoFiles={['src/app/examples/object-management/object-management-read-only-inspector.component.ts']}
/>

`addObject()` seeds the canvas with sample shapes, text, and lines on startup. `getAllObjects()` then loads the full snapshot. The three output events — `objectsAdded`, `objectsRemoved`, and `objectsUpdated` — fire for both user-driven and programmatic changes, so binding them once is enough to keep the list current at all times.

---

## Interactive Object Panel

A panel-style sidebar where clicking a row selects the object on the canvas, and each row offers actions to adjust opacity or delete the object entirely.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-interactive-layer-panel"
  repoFiles={['src/app/examples/object-management/object-management-interactive-layer-panel.component.ts']}
/>

`panTo(x, y)` moves the viewport so the object's center is on screen, and `selectObjects([obj])` switches the active tool to selection and highlights it — passing an empty array clears the selection. `updateObject(obj, { opacity })` merges partial properties and rerenders the canvas. `removeObject(obj)` deletes the object and emits `objectsRemoved`, which the same event handler picks up to refresh the list.

---

## Filtered Object Explorer

A panel with type-based filter toggles that both narrow the sidebar list and visually dim non-matching objects on the canvas by adjusting their opacity.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-filtered-explorer"
  repoFiles={['src/app/examples/object-management/object-management-filtered-explorer.component.ts']}
/>

A `computed()` signal derives `filteredObjects` from the selected type set, keeping the template reactive without manual subscriptions. Toggling a filter calls `applyOpacityFilter()`, which iterates through all objects and sets `opacity: 1` for matching types and `opacity: 0.5` for the rest via `updateObject()`.
