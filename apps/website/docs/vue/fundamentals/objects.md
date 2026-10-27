---
sidebar_label: Objects
displayed_sidebar: tutorialSidebar
title: "Objects Concept | Kritzel for Vue"
description: "Understand the core concept of Objects in Kritzel."
heading_badges:
  configuring-objects: Preview
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

You can manually inject objects into the canvas programmatically, bypassing the need for a user to draw them.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/add"
  repoFiles={['src/pages/fundamentals/objects/ObjectsAddPage.vue']}
/>

## Removing Objects

You can remove objects from the canvas programmatically when they are no longer needed.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/remove"
  repoFiles={['src/pages/fundamentals/objects/ObjectsRemovePage.vue']}
/>

## Updating Objects

Object properties should never be mutated directly. Instead, changes go through `updateObject()`, which takes the object and a partial set of properties to apply. This ensures the change is properly persisted, synced, and reflected on the canvas.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/update"
  repoFiles={['src/pages/fundamentals/objects/ObjectsUpdatePage.vue']}
/>

## Selecting Objects

You can programmatically retrieve the currently selected objects, select specific objects, or clear the selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/selection"
  repoFiles={['src/pages/fundamentals/objects/ObjectsSelectionPage.vue']}
/>

## Filtering Objects

Use `getAllObjects()` to retrieve the current canvas objects, or `findObjects()` to return only the objects that match a predicate. `findObjects()` excludes Kritzel's internal selection-related objects.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/filter"
  repoFiles={['src/pages/fundamentals/objects/ObjectsFilterPage.vue']}
/>

## Grouping Objects

Objects can be grouped together so they can be moved and transformed as a single unit.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/grouping"
  repoFiles={['src/pages/fundamentals/objects/ObjectsGroupingPage.vue']}
/>

## Ordering Objects

Objects' z-index can be changed to control their visual stacking order, for example by bringing them to the front or sending them backward. A group counts as one layer: reordering it moves all of its children together, while a grouped object is reordered within its group.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/ordering"
  repoFiles={['src/pages/fundamentals/objects/ObjectsOrderingPage.vue']}
/>

## Configuring Objects

Bind a `KritzelObjectConfig` to `:objectConfig` to decide in one place which objects can be rotated or resized and which get a [titlebar](./controls.md#object-titlebar). Each option is either a boolean for every object or a function that receives an object and returns a boolean. Compare `object.__class__` to decide by type, because `instanceof` fails when the app bundles more than one copy of the engine.

```ts
import type { KritzelObjectConfig } from '@kritzel/vue-editor'

const objectConfig: KritzelObjectConfig = {
  hasTitlebar: object => !!object.name,
  isRotatable: object => object.__class__ !== 'KritzelText',
  isResizable: object => object.__class__ !== 'KritzelImage',
}
```

`isRotatable` and `isResizable` default to `true` and combine with the object's own flags of the same name, so either one can forbid the gesture. Groups and multi-selections can only be rotated or resized when every object inside them allows it. Functions must be synchronous and cheap, and a function that throws resolves to the option's default. Define it in `<script setup>`, or derive it with `computed()`, and pass a new object to change it at runtime, because the editor only rerenders when it receives a new configuration object.

The configuration is local to your app and neither persisted nor synced. Set the flags on an object instead to apply a restriction on every client.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/fundamentals/objects/configuration"
  repoFiles={['src/pages/fundamentals/objects/ObjectsConfigurationPage.vue']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Object](../api-reference/editor.md#object)
- [Selection](../api-reference/editor.md#selection)
- [Ordering](../api-reference/editor.md#ordering)
- [Alignment](../api-reference/editor.md#alignment)
- [Grouping](../api-reference/editor.md#grouping)
- [Object Config Types](../api-reference/types.md#object-config-types)