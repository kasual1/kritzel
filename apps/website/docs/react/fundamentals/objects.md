---
sidebar_label: Objects
displayed_sidebar: tutorialSidebar
title: "Objects Concept | Kritzel for React"
description: "Understand the core concept of Objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Canvas Objects

## Overview

Everything visually rendered onto the Kritzel canvas, whether it is a brush stroke, a text block, or an image, is conceptually an **Object**.

All objects share a common foundational structure. No matter the specific type, every object tracks its spatial existence in the infinite canvas using standard 2D properties:

- **Position and Dimensions:** `x`, `y`, `width`, `height`
- **Transforms:** `rotation`, `scale`
- **Styling:** `opacity`, `backgroundColor`, `borderColor`, `zIndex`

Because all objects share this base, the engine can uniformly handle hit-testing, rendering bounds, and selection outlines. Currently, tools create specific instances of sub-classed objects: `KritzelPath`, `KritzelLine`, `KritzelShape`, `KritzelText`, `KritzelImage`, and `KritzelDynamicObject`.

## Adding and Removing Objects

You can manually inject objects into the canvas or remove them programmatically, bypassing the need for a user to draw them.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/add-remove"
  repoFiles={['src/pages/fundamentals/objects/ObjectsAddRemovePage.tsx']}
/>

## Querying and Filtering Objects

Kritzel allows you to read the state of all objects currently on the canvas or find specific objects. This is useful for building layer panels or object inspectors.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/query"
  repoFiles={['src/pages/fundamentals/objects/ObjectsQueryPage.tsx']}
/>

## Managing Object Selection

You can programmatically retrieve the currently selected objects, select specific objects, or clear the selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/selection"
  repoFiles={['src/pages/fundamentals/objects/ObjectsSelectionPage.tsx']}
/>

## Grouping

Objects can be grouped together so they can be moved and transformed as a single unit.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/grouping"
  repoFiles={['src/pages/fundamentals/objects/ObjectsGroupingPage.tsx']}
/>

## Ordering

Objects' z-index can be changed to control their visual stacking order, for example by bringing them to the front or sending them backward.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/ordering"
  repoFiles={['src/pages/fundamentals/objects/ObjectsOrderingPage.tsx']}
/>

## Related API Methods

- Lifecycle (`addObject()`, `removeObject()`, `updateObject()`, `getObjectById()`)
- Queries (`getAllObjects()`, `findObjects()`, `getObjectsTotalCount()`, `getObjectsInViewport()`)
- Manipulation (`group()`, `ungroup()`, `bringToFront()`, `sendBackward()`, `alignObjects()`)
- Selection (`getSelectedObjects()`, `selectObjects()`, `clearSelection()`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).