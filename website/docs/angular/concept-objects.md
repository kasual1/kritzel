---
sidebar_label: Objects
displayed_sidebar: tutorialSidebar
title: "Objects Concept | Kritzel for Angular"
description: "Understand the core concept of Objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Canvas Objects

## Overview

Everything visually rendered onto the Kritzel canvas—whether it's a brush stroke, a text block, or an image—is conceptually an **Object**. 

All objects share a common foundational structure. No matter the specific type, every object tracks its spatial existence in the infinite canvas using standard 2D properties:
- **Position & Dimensions:** `x`, `y`, `width`, `height`
- **Transforms:** `rotation`, `scale`
- **Styling:** `opacity`, `backgroundColor`, `borderColor`, `zIndex`

Because all objects share this base, the engine can uniformly handle hit-testing, rendering bounds, and selection outlines. Currently, tools create specific instances of sub-classed objects: `KritzelPath`, `KritzelLine`, `KritzelShape`, `KritzelText`, `KritzelImage`, and `KritzelCustomElement`.

## Adding and Removing Objects

You can manually inject objects into the canvas or remove them programmatically, bypassing the need for a user to draw them.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/objects-add-remove"
  repoFiles={['src/app/concepts/objects/objects-add-remove.component.ts']}
/>

## Querying and Filtering Objects

Kritzel allows you to read the state of all objects currently on the canvas, or find specific objects. This is useful for building layer panels or object inspectors.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/objects-query"
  repoFiles={['src/app/concepts/objects/objects-query.component.ts']}
/>

## Managing Object Selection

You can programmatically retrieve the currently selected objects, select specific objects, or clear the selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/objects-selection"
  repoFiles={['src/app/concepts/objects/objects-selection.component.ts']}
/>

## Grouping and Ordering

Objects can be grouped together so they can be moved and transformed as a single unit or their z-index ordered.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/objects-grouping"
  repoFiles={['src/app/concepts/objects/objects-grouping.component.ts']}
/>

## Related API Methods

- Lifecycle (`addObject()`, `removeObject()`, `updateObject()`, `getObjectById()`)
- Queries (`getAllObjects()`, `findObjects()`, `getObjectsTotalCount()`, `getObjectsInViewport()`)
- Manipulation (`group()`, `ungroup()`, `bringToFront()`, `sendBackward()`, `alignObjects()`)
- Selection (`getSelectedObjects()`, `selectObjects()`, `clearSelection()`)

For a comprehensive view, see the [API Reference](api-reference-editor.md).
