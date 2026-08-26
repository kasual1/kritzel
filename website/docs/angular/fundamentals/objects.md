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
  demoPath="/fundamentals/objects/add-remove"
  repoFiles={['src/app/fundamentals/objects/objects-add-remove.component.ts']}
/>

## Querying and Filtering Objects

Kritzel allows you to read the state of all objects currently on the canvas, or find specific objects. This is useful for building layer panels or object inspectors.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/query"
  repoFiles={['src/app/fundamentals/objects/objects-query.component.ts']}
/>

## Managing Object Selection

You can programmatically retrieve the currently selected objects, select specific objects, or clear the selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/selection"
  repoFiles={['src/app/fundamentals/objects/objects-selection.component.ts']}
/>

## Grouping

Objects can be grouped together so they can be moved and transformed as a single unit.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/grouping"
  repoFiles={['src/app/fundamentals/objects/objects-grouping.component.ts']}
/>

## Ordering

Objects' z-index can be changed to control their visual stacking order, for example by bringing them to the front or sending them backward.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/ordering"
  repoFiles={['src/app/fundamentals/objects/objects-ordering.component.ts']}
/>

## Related API Methods

- Lifecycle ([addObject](../api-reference/editor.md#addobject), [removeObject](../api-reference/editor.md#removeobject), [updateObject](../api-reference/editor.md#updateobject), [getObjectById](../api-reference/editor.md#getobjectbyid))
- Queries ([getAllObjects](../api-reference/editor.md#getallobjects), [findObjects](../api-reference/editor.md#findobjects), [getObjectsTotalCount](../api-reference/editor.md#getobjectstotalcount), [getObjectsInViewport](../api-reference/editor.md#getobjectsinviewport))
- Manipulation ([group](../api-reference/editor.md#group), [ungroup](../api-reference/editor.md#ungroup), [bringToFront](../api-reference/editor.md#bringtofront), [sendBackward](../api-reference/editor.md#sendbackward), [alignObjects](../api-reference/editor.md#alignobjects))
- Selection ([getSelectedObjects](../api-reference/editor.md#getselectedobjects), [selectObjects](../api-reference/editor.md#selectobjects), [clearSelection](../api-reference/editor.md#clearselection))

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
