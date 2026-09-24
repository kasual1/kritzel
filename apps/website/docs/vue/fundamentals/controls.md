---
sidebar_label: Controls
displayed_sidebar: tutorialSidebar
title: "Controls Concept | Kritzel for Vue"
description: "Configure Kritzel Editor's built-in controls and context menus."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Controls

## Overview

The `<KritzelEditor>` includes a complete set of whiteboard controls, including toolbars, utility panels, context menus, and settings dialogs. You can selectively hide them or adjust them to fit your application's behavior.

## Toolbar and Utility Panel

The toolbar provides the configured drawing and selection tools, while the utility panel exposes undo, redo, and delete actions. Set `isToolbarVisible` or `isUtilityPanelVisible` to `false` independently to replace either control surface without changing the editor's core functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/toolbar-utility-panel"
  repoFiles={['src/pages/fundamentals/controls/ToolbarUtilityPanelPage.vue']}
/>

## Workspace Manager

The workspace manager in the top-left corner lets people switch between workspaces and create, rename, or delete them. Set `isWorkspaceManagerVisible` to `false` to hide it. Call `openWorkspaceManagerMenu()` to programmatically open the workspace manager's menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/workspace-manager-open"
  repoFiles={['src/pages/fundamentals/controls/WorkspaceManagerOpenPage.vue']}
/>

## Context Menu

The Editor separates right-click actions into two arrays: `globalContextMenuItems` for empty-canvas interactions, and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, and an `action` handler.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/context-menus-canvas-quick-actions"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusCanvasQuickActionsPage.vue']}
/>

Items can also call clipboard methods such as `copy`, `paste`, and `delete`, wiring the menu to the same actions available from keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/context-menus-clipboard-actions"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusClipboardActionsPage.vue']}
/>

Use `group` to cluster related entries with a separator, and `children` to nest a submenu of arbitrary depth for actions that do not need a top-level entry.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/context-menus-object-inspector"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusObjectInspectorPage.vue']}
/>

The optional `isVisible` and `isDisabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling "Select All" when the viewport is empty.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/context-menus-smart-conditional"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusSmartConditionalPage.vue']}
/>

## More Menu

The more menu in the top-right corner groups secondary editor actions. Set `isMoreMenuVisible` to `false` to hide it. Call `openMoreMenu()` to programmatically open it. Pass an array of menu items to the `moreMenuItems` prop to dynamically configure the items shown in the menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/more-menu-open"
  repoFiles={['src/pages/fundamentals/controls/MoreMenuOpenPage.vue']}
/>

## Export Dialog

The export dialog allows users to save the current viewport as an image or export the current workspace as JSON. You can either open it as part of the default more menu or trigger it programmatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/export-dialog"
  repoFiles={['src/pages/fundamentals/controls/ExportDialogPage.vue']}
/>

## Import Dialog

The import dialog allows users to load a workspace stored as JSON. You can either open it as part of the default more menu or trigger it programmatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/import-dialog"
  repoFiles={['src/pages/fundamentals/controls/ImportDialogPage.vue']}
/>

## Zoom Panel

The zoom panel shows the current zoom level and provides zoom-in and zoom-out buttons. Set `isZoomPanelVisible` to `false` to hide it. On small screens, the zoom panel is automatically hidden to save space.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/zoom-panel-toggle"
  repoFiles={['src/pages/fundamentals/controls/ZoomPanelTogglePage.vue']}
/>

## Notifications

Call `triggerNotification()` to display a transient message in the editor. Notifications have `info`, `warning`, and `error` types, allowing your application to provide feedback without building a separate notification surface.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/controls/notifications-trigger"
  repoFiles={['src/pages/fundamentals/controls/NotificationsTriggerPage.vue']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor UI Elements](../api-reference/editor.md#ui-elements)