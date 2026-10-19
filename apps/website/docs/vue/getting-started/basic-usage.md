---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Kritzel for Vue"
description: "Learn the main ways to interact with Kritzel from Vue: set props, listen to events, and call public methods."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

## Overview

For most use cases `<KritzelEditor>` is the preferred choice. It gives you a ready-made whiteboard experience and includes customizable controls that can be further tuned to your needs. Only use `<KritzelEngine>` when you want to build the entire UI yourself.

Once `<KritzelEditor>` or `<KritzelEngine>` is rendering in your application, you can interact with the canvas in three complementary ways:

- **Setting props** to configure the component declaratively.
- **Listening to events** to react to changes from the editor or engine.
- **Calling methods** to make imperative changes or query state.

While `<KritzelEditor>` is the main way to integrate Kritzel into your application, the same APIs also apply to `<KritzelEngine>`. The examples below focus on `<KritzelEditor>`, but the concepts carry over to the engine as well.

For the full documentation, see the API reference for the [Editor](../api-reference/editor.md) or the [Engine](../api-reference/engine.md).

## Waiting for Initialization

Before interacting with an editor instance through its public API, wait for the editor's `isReady` event. `<KritzelEditor>` emits `isReady` after the engine is mounted, the internal rendering context is created, and the initial workspace state is available.

```html
<script setup lang="ts">
import { KritzelEditor, getEditorRef } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')

async function onReady() {
  await editor.value?.setActiveTool('brush')
}
</script>

<template>
  <KritzelEditor ref="editor" @isReady="onReady" style="display: block; width: 100%; height: 100vh" />
</template>
```

Only call methods such as `setActiveTool` after the editor has emitted the `isReady` event.

## Setting Props

Props are the declarative way to configure the editor. Use props such as `theme`, `scaleMin`, `syncConfig`, and `isToolbarVisible` to customize editor behavior and the built-in UI. Keep object and array props in stable top-level constants rather than inline template expressions.

```html
<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor } from '@kritzel/vue-editor'

const isToolbarVisible = ref(false)
</script>

<template>
  <KritzelEditor :isToolbarVisible="isToolbarVisible" />
</template>
```

Changing `isToolbarVisible` from Vue state hides or shows the editor's toolbar.

## Listening to Events

Events report editor state changes. Bind camelCase custom-element events with `@` and read their payload from `event.detail`. The payload type depends on the event; for example, `objectsChange` contains the current objects and `viewportChange` contains the current viewport state.

```html
<script setup lang="ts">
import {
  KritzelEditor,
  type KritzelBaseObject,
  type KritzelViewportState,
} from '@kritzel/vue-editor'

function onObjectsChange(event: Event) {
  const objects = (event as CustomEvent<KritzelBaseObject[]>).detail
  console.log('Canvas objects updated:', objects.length)
}

function onViewportChange(event: Event) {
  const viewport = (event as CustomEvent<KritzelViewportState>).detail
  console.log('Viewport updated:', viewport)
}
</script>

<template>
<KritzelEditor
  @objectsChange="onObjectsChange"
  @viewportChange="onViewportChange"
/>
</template>
```

The `isReady` event is also an event you can listen to. Treat it as the point at which code that calls the editor's public methods may start running.

## Calling Methods

Public methods are the imperative way to control the editor canvas and query its state. Kritzel methods are asynchronous and return promises, so call them from an `async` function and `await` their results. Resolve the native editor element with `getEditorRef`; a raw Vue template ref points to the wrapper component instance.

```html
<script setup lang="ts">
import { KritzelEditor, KritzelText, getEditorRef } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')

async function addText() {
  await editor.value?.addObject(new KritzelText({
    text: 'Programmatic text!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: { light: '#ff0000', dark: '#ff6666' },
  }))
}
</script>

<template>
  <KritzelEditor ref="editor" @isReady="addText" />
</template>
```

Other object, tool, and viewport methods follow the same asynchronous pattern.

## Basic Usage Example

Below is a complete example combining props, events, and public methods. It uses the editor's custom toolbar to trigger methods, inserts programmatic text, zooms the viewport, and displays a dynamic object count from an event.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  repoFiles={['src/pages/getting-started/BasicUsagePage.vue']}
  demoPath="/getting-started/basic-usage"
/>