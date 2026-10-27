---
sidebar_label: Controls
displayed_sidebar: tutorialSidebar
title: "Controls Concept | Kritzel for React"
description: "Configure Kritzel Editor's built-in controls and context menus."
toc_badges:
  object-titlebar: Preview
---

import LiveDemo from '@site/src/components/LiveDemo';

# Controls

## Overview

The `<KritzelEditor>` includes a complete set of whiteboard controls, including toolbars, utility panels, context menus, and settings dialogs. You can selectively hide them or adjust them to fit your application's behavior.

## Toolbar and Utility Panel

The toolbar provides the configured drawing and selection tools, while the utility panel exposes undo, redo, and delete actions. Set `isToolbarVisible` or `isUtilityPanelVisible` to `false` independently to replace either control surface without changing the editor's core functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/toolbar-utility-panel"
  repoFiles={['src/pages/fundamentals/controls/ToolbarUtilityPanelPage.tsx']}
/>

## Object Titlebar

A titlebar is an optional bar rendered above an object, similar to the frame labels in design tools. Pass a `KritzelObjectTitlebarConfig` such as the ready-made `KRITZEL_DEFAULT_OBJECT_TITLEBAR` to the `objectTitlebar` prop, and choose which objects get a titlebar with the `hasTitlebar` option of the `objectConfig` prop, either `true` or a function that receives an object. Both are required. The titlebar shows the object's `name`, or a localized type label such as `Shape` if it has none. Pressing a titlebar selects its object, and dragging it moves the object.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/titlebar/configure"
  repoFiles={['src/pages/customization/titlebar/TitlebarConfigurePage.tsx']}
/>

The configuration has `left`, `center`, and `right` sections, each holding an array of `title`, `text`, `icon`, `button`, `menu`, `spacer`, or `separator` elements. Most element options accept a function of the titlebar context, for example to show the size of an object. Button clicks and menu item selections emit `objectTitlebarAction`, which you can handle with the `onObjectTitlebarAction` prop. Set `isEditable` on a `title` element to let users rename objects from their titlebar.

Titlebars are styled through the `titlebar` and `titlebarMenu` sections of `KritzelTheme`, and expose parts such as `titlebar`, `titlebar-title`, and `titlebar-button` on `<kritzel-engine>` for `::part()` rules.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/titlebar/styling"
  repoFiles={['src/pages/customization/titlebar/TitlebarStylingPage.tsx']}
/>

## Workspace Manager

The workspace manager in the top-left corner lets people switch between workspaces and create, rename, or delete them. Set `isWorkspaceManagerVisible` to `false` to hide it. Use a typed editor ref and await `openWorkspaceManagerMenu()` to programmatically open the workspace manager's menu after `onIsReady` fires.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/workspace-manager-open"
  repoFiles={['src/pages/fundamentals/controls/WorkspaceManagerOpenPage.tsx']}
/>

## Context Menu

The Editor separates right-click actions into two arrays: `globalContextMenuItems` for empty-canvas interactions and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, and an `action` handler. Keep these array props stable with `useMemo` or module-level constants.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/context-menus-canvas-quick-actions"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusCanvasQuickActionsPage.tsx']}
/>

Items can also call clipboard methods such as `copy`, `paste`, and `delete`, wiring the menu to the same actions available from keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/context-menus-clipboard-actions"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusClipboardActionsPage.tsx']}
/>

Use `group` to cluster related entries with a separator, and `children` to nest a submenu of arbitrary depth for actions that do not need a top-level entry.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/context-menus-object-inspector"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusObjectInspectorPage.tsx']}
/>

The optional `isVisible` and `isDisabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling "Select All" when the viewport is empty.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/context-menus-smart-conditional"
  repoFiles={['src/pages/fundamentals/controls/ContextMenusSmartConditionalPage.tsx']}
/>

## More Menu

The more menu in the top-right corner groups secondary editor actions. Set `isMoreMenuVisible` to `false` to hide it. Await `openMoreMenu()` to programmatically open it. Pass a stable array of menu items to the `moreMenuItems` prop to configure the actions shown in the menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/more-menu-open"
  repoFiles={['src/pages/fundamentals/controls/MoreMenuOpenPage.tsx']}
/>

## Export Dialog

The export dialog allows users to save the current viewport as an image or export the current workspace as JSON. You can open it from the default more menu or await `openExportDialog()` on the editor ref after the editor is ready.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/export-dialog"
  repoFiles={['src/pages/fundamentals/controls/ExportDialogPage.tsx']}
/>

## Import Dialog

The import dialog allows users to load a workspace stored as JSON. You can open it from the default more menu or await `openImportDialog()` on the editor ref.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/import-dialog"
  repoFiles={['src/pages/fundamentals/controls/ImportDialogPage.tsx']}
/>

## Zoom Panel

The zoom panel shows the current zoom level and provides zoom-in and zoom-out buttons. Set `isZoomPanelVisible` to `false` to hide it. On small screens, the zoom panel is automatically hidden to save space.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/zoom-panel-toggle"
  repoFiles={['src/pages/fundamentals/controls/ZoomPanelTogglePage.tsx']}
/>

## Notifications

Call `triggerNotification()` to display a transient message in the editor. Notifications have `info`, `warning`, and `error` types, allowing your application to provide feedback without building a separate notification surface.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/controls/notifications-trigger"
  repoFiles={['src/pages/fundamentals/controls/NotificationsTriggerPage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [UI Elements](../api-reference/editor.md#ui-elements)
- [General](../api-reference/editor.md#general)
- [Object Titlebar](../api-reference/editor.md#object-titlebar)
- [Configuring Objects](./objects.md#configuring-objects)
- [Titlebar Theming](../api-reference/theming.md#titlebar)
- [Object Titlebar Types](../api-reference/types.md#object-titlebar-types)