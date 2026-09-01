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

## Workspace Manager

The workspace manager in the top-left corner lets people switch between workspaces and create, rename, or delete them. Set `isWorkspaceManagerVisible` to `false` when your application provides workspace navigation elsewhere or presents a single document. Use `openWorkspaceManagerMenu()` when your application should open the built-in workspace menu programmatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/workspace-manager-open"
  repoFiles={['src/app/fundamentals/components/workspace-manager-open.component.ts']}
/>

## More Menu

The more menu in the top-right corner groups secondary editor actions. Use `moreMenuItems` to provide its actions, and set `isMoreMenuVisible` to `false` when those actions belong in your application's own interface. Use `openMoreMenu()` to open the built-in More menu from a command palette, onboarding flow, or other application-level control.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/more-menu-open"
  repoFiles={['src/app/fundamentals/components/more-menu-open.component.ts']}
/>

## Toolbar and Utility Panel

The toolbar provides the configured drawing and selection tools, while the utility panel exposes undo, redo, and delete actions. Set `isToolbarVisible` or `isUtilityPanelVisible` to `false` independently to replace either control surface without changing the editor's core functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/toolbar-utility-panel"
  repoFiles={['src/app/fundamentals/components/toolbar-utility-panel.component.ts']}
/>

## Zoom Panel

The zoom panel shows the current zoom level and provides zoom-in and zoom-out buttons. Set `isZoomPanelVisible` to `false` when viewport controls are supplied elsewhere in your application.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/zoom-panel-toggle"
  repoFiles={['src/app/fundamentals/components/zoom-panel-toggle.component.ts']}
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

The optional `isVisible` and `isDisabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling "Select All" when the viewport is empty.

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