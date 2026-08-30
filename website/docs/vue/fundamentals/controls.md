---
sidebar_label: Controls
displayed_sidebar: tutorialSidebar
title: "Controls Concept | Kritzel for Vue"
description: "Configure Kritzel Editor's built-in controls and context menus."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Controls

## Overview

`<KritzelEditor>` includes a complete whiteboard interface, including toolbars, utility panels, context menus, and settings dialogs. You can selectively hide its built-in UI elements for a more focused experience, or replace the context-menu actions with controls tailored to your application.

## Toggling Controls

Use the Editor's visibility props to toggle built-in UI components. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to `false` hides the workspace manager and more menu. `isToolbarVisible`, `isUtilityPanelVisible`, and `isZoomPanelVisible` control the tool toolbar, utility panel, and zoom control panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/editor-ui"
  repoFiles={['src/pages/fundamentals/components/ComponentsEditorUiPage.vue']}
/>

## Configuring Context Menus

The Editor separates right-click actions into `globalContextMenuItems` for empty-canvas interactions and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, and an `action` handler.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/context-menus-canvas-quick-actions"
  repoFiles={['src/pages/fundamentals/components/ContextMenusCanvasQuickActionsPage.vue']}
/>

Items can also call clipboard methods such as `copy`, `paste`, and `delete`, wiring the menu to the same actions available from keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/context-menus-clipboard-actions"
  repoFiles={['src/pages/fundamentals/components/ContextMenusClipboardActionsPage.vue']}
/>

Use `group` to cluster related entries with a separator, and `children` to nest a submenu of arbitrary depth for actions that do not need a top-level entry.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/context-menus-object-inspector"
  repoFiles={['src/pages/fundamentals/components/ContextMenusObjectInspectorPage.vue']}
/>

The optional `isVisible` and `isDisabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling Select All when the viewport is empty.
The optional `isVisible` and `isDisabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling Select All when the viewport is empty.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/context-menus-smart-conditional"
  repoFiles={['src/pages/fundamentals/components/ContextMenusSmartConditionalPage.vue']}
/>

## Notifications

Call `triggerNotification()` to display a transient message in the editor. Notifications have `info`, `warning`, and `error` types, allowing your application to provide feedback without building a separate notification surface.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/components/notifications-trigger"
  repoFiles={['src/pages/fundamentals/components/NotificationsTriggerPage.vue']}
/>

## Related API Methods

- Context menu configuration (`globalContextMenuItems`, `objectContextMenuItems`, `ContextMenuItem`)
- Editor UI options (`isToolbarVisible`, `isUtilityPanelVisible`, `isWorkspaceManagerVisible`, `isMoreMenuVisible`, `isZoomPanelVisible`, `moreMenuItems`)
- Notifications (`triggerNotification`, `KritzelNotification`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).