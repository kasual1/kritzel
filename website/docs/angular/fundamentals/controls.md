---
sidebar_label: Controls
displayed_sidebar: tutorialSidebar
title: "Controls Concept | Kritzel for Angular"
description: "Configure Kritzel Editor's built-in controls and context menus."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Controls

## Overview

The `<kritzel-editor>` includes a complete whiteboard interface, including toolbars, utility panels, context menus, and settings dialogs. You can selectively hide its built-in UI elements for a more focused experience, or replace the context-menu actions with controls tailored to your application.

## Components

You can toggle visibility for built-in UI components using the Editor's attributes. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to false will not render the workspace manager at the top left nor the more menu at the top right, giving you a more minimal interface while retaining all core whiteboard functionality. `isToolbarVisible`, `isUtilityPanelVisible`, and `isZoomPanelVisible` work the same way for the tool toolbar, the utility panel, and the zoom control panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/editor-ui"
  repoFiles={['src/app/fundamentals/components/components-editor-ui.component.ts']}
/>

## Context Menu

The Editor separates right-click actions into two arrays: `globalContextMenuItems` for empty-canvas interactions, and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, and an `action` handler.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/context-menus-canvas-quick-actions"
  repoFiles={['src/app/fundamentals/components/context-menus-canvas-quick-actions.component.ts']}
/>

Items can also call into clipboard methods such as `copy`, `paste`, and `delete`, wiring the menu to the same actions available from keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/context-menus-clipboard-actions"
  repoFiles={['src/app/fundamentals/components/context-menus-clipboard-actions.component.ts']}
/>

Use `group` to cluster related entries with a separator, and `children` to nest a submenu of arbitrary depth for actions that don't need a top-level entry.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/context-menus-object-inspector"
  repoFiles={['src/app/fundamentals/components/context-menus-object-inspector.component.ts']}
/>

The optional `visible` and `disabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling "Select All" when the viewport is empty.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/context-menus-smart-conditional"
  repoFiles={['src/app/fundamentals/components/context-menus-smart-conditional.component.ts']}
/>

## Notifications

Call `triggerNotification()` to display a transient message in the editor. Notifications have `info`, `warning`, and `error` types, allowing your application to provide feedback without building a separate notification surface.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/notifications-trigger"
  repoFiles={['src/app/fundamentals/components/notifications-trigger.component.ts']}
/>

## Related API Methods

- Context menu configuration ([globalContextMenuItems](../api-reference/editor.md#props), [objectContextMenuItems](../api-reference/editor.md#props), `ContextMenuItem`)
- Editor UI options ([isToolbarVisible](../api-reference/editor.md#props), [isUtilityPanelVisible](../api-reference/editor.md#props), [isWorkspaceManagerVisible](../api-reference/editor.md#props), [isMoreMenuVisible](../api-reference/editor.md#props), [isZoomPanelVisible](../api-reference/editor.md#props), [moreMenuItems](../api-reference/editor.md#props))
- Notifications ([triggerNotification](../api-reference/editor.md#triggernotification), `KritzelNotification`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).