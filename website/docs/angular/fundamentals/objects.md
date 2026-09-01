---
sidebar_label: Objects
displayed_sidebar: tutorialSidebar
title: "Objects Concept | Kritzel for Angular"
description: "Understand the core concept of Objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Objects

## Overview

Everything placed on the Kritzel canvas is considered an object. Objects can be either added using a tool from the toolbar or programmatically via the editor's API.

Kritzel comes with the following built-in objects:

- [Path](../api-reference/objects.md#path)
- [Line](../api-reference/objects.md#line)
- [Shape](../api-reference/objects.md#shape)
- [Text](../api-reference/objects.md#text)
- [Image](../api-reference/objects.md#image)
- [Group](../api-reference/objects.md#group)
- [Dynamic Object](../api-reference/objects.md#dynamic-object)

Take a look at [Tools](tools.md) for more information on how to create and manipulate objects using the toolbar.

## Adding Objects

You can manually inject objects into the canvas programmatically, bypassing the need for a user to draw them.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/add"
  repoFiles={['src/app/fundamentals/objects/objects-add.component.ts']}
/>

## Removing Objects

You can remove objects from the canvas programmatically when they are no longer needed.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/remove"
  repoFiles={['src/app/fundamentals/objects/objects-remove.component.ts']}
/>

## Updating Objects

Object properties should never be mutated directly. Instead, changes go through `updateObject()`, which takes the object and a partial set of properties to apply. This ensures the change is properly persisted, synced, and reflected on the canvas.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/update"
  repoFiles={['src/app/fundamentals/objects/objects-update.component.ts']}
/>

## Selecting Objects

You can programmatically retrieve the currently selected objects, select specific objects, or clear the selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/selection"
  repoFiles={['src/app/fundamentals/objects/objects-selection.component.ts']}
/>

## Filtering Objects

Use `getAllObjects()` to retrieve the current canvas objects, or `findObjects()` to return only the objects that match a predicate. `findObjects()` excludes Kritzel's internal selection-related objects.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/filter"
  repoFiles={['src/app/fundamentals/objects/objects-filter.component.ts']}
/>

## Grouping Objects

Objects can be grouped together so they can be moved and transformed as a single unit.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/objects/grouping"
  repoFiles={['src/app/fundamentals/objects/objects-grouping.component.ts']}
/>

## Ordering Objects

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
