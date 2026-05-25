---
sidebar_label: Object Management
displayed_sidebar: tutorialSidebar
title: "Object Management Example | Kritzel for Angular"
description: "Build a programmatic object layer panel step by step, from a read-only snapshot up to real-time updates, selection control, and property mutation."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Programmatic Object Management

This guide builds up programmatic object management step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Object Management Works

Every canvas object extends `KritzelBaseObject`, which exposes common properties such as `id`, `__class__`, `opacity`, `zIndex`, `isVisible`, `translateX`, `translateY`, `width`, and `height`. Subclasses like `KritzelShape`, `KritzelText`, and `KritzelPath` add type-specific properties on top.

The editor exposes three read methods — `getAllObjects()`, `findObjects(predicate)`, and `getObjectById(id)` — and three write methods — `addObject(object)`, `updateObject(object, partialProps)`, and `removeObject(object)`. The write methods each emit a corresponding output event (`objectsAdded`, `objectsUpdated`, `objectsRemoved`) carrying the affected objects. These same events fire when the user draws or erases objects interactively, so a single set of handlers covers all change sources. `selectObjects(objects)` switches to the selection tool and programmatically highlights the given objects.

---

## Step 1: Reading All Objects on Ready

Wait for the `isReady` event, then call `getAllObjects()` to load the initial snapshot into a signal:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-1"
  repoFiles={['src/app/examples/object-management-1.component.ts']}
/>

`getAllObjects()` returns a live array reference from the canvas store. The signal holds a snapshot of that array at the moment of the call; it will not update automatically as objects are added or removed.

---

## Step 2: Keeping the List Current with Events

Add the three change outputs to the template and update the signal in each handler:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-2"
  repoFiles={['src/app/examples/object-management-2.component.ts']}
/>

Each output fires for both user-driven and programmatic changes, so these three handlers are the only place that needs to keep the list in sync. `onObjectsUpdated` re-spreads the existing array because the object references themselves are mutated in place by `updateObject()`.

---

## Step 3: Selecting an Object Programmatically

Add a click handler to each list item that calls `selectObjects()`:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-3"
  repoFiles={['src/app/examples/object-management-3.component.ts']}
/>

`selectObjects()` switches the active tool to the selection tool and highlights the given objects on the canvas, exactly as if the user had clicked them. Passing an empty array clears the selection.

---

## Step 4: Mutating an Object

Add a button next to each row that halves the object's opacity using `updateObject()`:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-4"
  repoFiles={['src/app/examples/object-management-4.component.ts']}
/>

`updateObject()` merges the partial properties into the existing object, rerenders the canvas, and emits `objectsUpdated` — which the handler from Step 2 picks up automatically, refreshing the list without any extra wiring.

---

## Step 5: Removing an Object Programmatically

Extend the row with a delete button that calls `removeObject()`:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-5"
  repoFiles={['src/app/examples/object-management-5.component.ts']}
/>

`removeObject()` deselects all objects, removes the target from the canvas store, rerenders, and emits `objectsRemoved`. The `onObjectsRemoved` handler from Step 2 filters it out of the signal automatically.

---

## Step 6: Filtering the List

Instead of restricting which objects are loaded, track all objects and provide filter toggles to dynamically update both the list and the canvas:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/object-management-6"
  repoFiles={['src/app/examples/object-management-6.component.ts']}
/>

A `computed()` signal derives the `filteredObjects` array so that only the selected types are rendered in the sidebar. To make the filtering visual on the canvas as well, toggling a filter triggers `applyOpacityFilter()`. This iterates through all loaded objects and calls `updateObject()`, setting `opacity: 1` for matching objects and `opacity: 0.5` for the rest.
