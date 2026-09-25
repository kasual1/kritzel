---
sidebar_label: Objects
displayed_sidebar: tutorialSidebar
title: "Objects Concept | Kritzel for React"
description: "Understand the core concept of Objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Objects

## Overview

Everything placed on the Kritzel canvas is considered an object. Objects can be either added using a tool from the toolbar or programmatically through the editor's API.

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

You can manually inject objects into the canvas programmatically, bypassing the need for a user to draw them. Create the appropriate object class, then await `addObject()` through a typed editor ref after `onIsReady` fires.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/add"
  repoFiles={['src/pages/fundamentals/objects/ObjectsAddPage.tsx']}
/>

## Removing Objects

You can remove objects from the canvas programmatically when they are no longer needed. Await `removeObject()` so dependent UI state is refreshed only after the mutation completes.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/remove"
  repoFiles={['src/pages/fundamentals/objects/ObjectsRemovePage.tsx']}
/>

## Updating Objects

Object properties should never be mutated directly. Instead, changes go through `updateObject()`, which takes the object and a partial set of properties to apply. This ensures the change is properly persisted, synced, and reflected on the canvas. Since `updateObject()` returns the replacement object, reselect that returned instance when the selection should remain active.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/update"
  repoFiles={['src/pages/fundamentals/objects/ObjectsUpdatePage.tsx']}
/>

## Selecting Objects

You can programmatically retrieve the currently selected objects, select specific objects, or clear the selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/selection"
  repoFiles={['src/pages/fundamentals/objects/ObjectsSelectionPage.tsx']}
/>

## Filtering Objects

Use `getAllObjects()` to retrieve the current canvas objects, or `findObjects()` to return only the objects that match a predicate. `findObjects()` excludes Kritzel's internal selection-related objects.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/filter"
  repoFiles={['src/pages/fundamentals/objects/ObjectsFilterPage.tsx']}
/>

## Grouping Objects

Objects can be grouped together so they can be moved and transformed as a single unit.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/grouping"
  repoFiles={['src/pages/fundamentals/objects/ObjectsGroupingPage.tsx']}
/>

## Ordering Objects

Objects' z-index can be changed to control their visual stacking order, for example by bringing them to the front or sending them backward.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/objects/ordering"
  repoFiles={['src/pages/fundamentals/objects/ObjectsOrderingPage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Object](../api-reference/editor.md#object)
- [Selection](../api-reference/editor.md#selection)
- [Ordering](../api-reference/editor.md#ordering)
- [Alignment](../api-reference/editor.md#alignment)
- [Grouping](../api-reference/editor.md#grouping)