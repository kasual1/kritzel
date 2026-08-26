---
sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor Concept | Kritzel for Vue"
description: "Understand the Kritzel Editor component, a batteries-included whiteboard UI."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Editor

## Overview

`<KritzelEditor>` is a high-level, batteries-included component providing a complete whiteboard UI, including toolbars, utility panels, context menus, and settings dialogs. It shares its entire programmatic API (asynchronous methods returning Promises for managing state, viewports, tools, and objects) with its headless sibling, the [Engine](./engine.md), so the two are interchangeable at the API level and differ only in built-in UI chrome.

## Basic Initialization

The basic implementation of the Editor requires zero configuration. You simply render the component, and a fully functional whiteboard will fit its container.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/editor"
  repoFiles={['src/pages/fundamentals/components/ComponentsEditorPage.vue']}
/>

## Waiting for Initialization

Because Kritzel performs asynchronous setup tasks internally (such as creating canvas elements and syncing state), you must wait for the `isReady` event before calling programmatic API methods:

```html
<script setup lang="ts">

import { KritzelEditor } from 'kritzel-vue'

const editor = ref<HTMLKritzelEditorElement | null>(null)

async function onEditorReady() {
  await editor.value?.setViewport({ pan: { x: 0, y: 0 }, zoom: 1 })
}
</script>

<template>
  <KritzelEditor ref="editor" @isReady="onEditorReady" />
</template>
```

## Customizing the Editor UI

You can toggle visibility for built-in UI components using props. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to `false` hides both areas and creates a more minimal interface while retaining all core whiteboard functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/editor-ui"
  repoFiles={['src/pages/fundamentals/components/ComponentsEditorUiPage.vue']}
/>

## Related API Methods

- Viewport and boundaries (`viewportBoundaryLeft`, `viewportBoundaryRight`, `scaleMin`, `scaleMax`)
- Theme management (`theme` prop)
- Context menu configuration (`globalContextMenuItems`, `objectContextMenuItems`)
- Editor-only UI options (`isToolbarVisible`, `isUtilityPanelVisible`, `isWorkspaceManagerVisible`, `isMoreMenuVisible`)

For a comprehensive view, see the [API Reference](../../api-reference/editor.md).
