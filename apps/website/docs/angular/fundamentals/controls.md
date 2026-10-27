---
sidebar_label: Controls
displayed_sidebar: tutorialSidebar
title: "Controls Concept | Kritzel for Angular"
description: "Configure Kritzel Editor's built-in controls and context menus."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Controls

## Overview

The `<kritzel-editor>` includes a complete set of whiteboard controls, including toolbars, utility panels, context menus, and settings dialogs. You can selectively hide them or adjust them to fit your applications behaviour.

## Toolbar and Utility Panel

The toolbar provides the configured drawing and selection tools, while the utility panel exposes undo, redo, and delete actions. Set `isToolbarVisible` or `isUtilityPanelVisible` to `false` independently to replace either control surface without changing the editor's core functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/toolbar-utility-panel"
  repoFiles={['src/app/pages/fundamentals/controls/toolbar-utility-panel.component.ts']}
/>

## Object Titlebar

A titlebar is an optional bar rendered above an object, similar to the frame labels in design tools. Pass a `KritzelObjectTitlebarConfig` such as the ready-made `KRITZEL_DEFAULT_OBJECT_TITLEBAR` to `[objectTitlebar]`, and choose which objects get a titlebar with the `hasTitlebar` option of `[objectConfig]`, either `true` or a function that receives an object. Both are required. The titlebar shows the object's `name`, or a localized type label such as `Shape` if it has none. Pressing a titlebar selects its object, and dragging it moves the object.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/titlebar/configure"
  repoFiles={['src/app/pages/customization/titlebar/titlebar-configure.component.ts']}
/>

The configuration has `left`, `center`, and `right` sections, each holding an array of `title`, `text`, `icon`, `button`, `menu`, `spacer`, or `separator` elements. Most element options accept a function of the titlebar context, for example to show the size of an object. Button clicks and menu item selections emit `objectTitlebarAction`, which you can handle with the `(objectTitlebarAction)` output. Set `isEditable` on a `title` element to let users rename objects from their titlebar.

Titlebars are styled through the `titlebar` and `titlebarMenu` sections of `KritzelTheme`, and expose parts such as `titlebar`, `titlebar-title`, and `titlebar-button` on `<kritzel-engine>` for `::part()` rules.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/titlebar/styling"
  repoFiles={['src/app/pages/customization/titlebar/titlebar-styling.component.ts']}
/>

## Workspace Manager

The workspace manager in the top-left corner lets people switch between workspaces and create, rename, or delete them. Set `isWorkspaceManagerVisible` to `false` in order to hide it. Call `openWorkspaceManagerMenu()` to programmatically open the workspace manager's menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/workspace-manager-open"
  repoFiles={['src/app/pages/fundamentals/controls/workspace-manager-open.component.ts']}
/>

## Context Menu

The Editor separates right-click actions into two arrays: `globalContextMenuItems` for empty-canvas interactions, and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, and an `action` handler.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/context-menus-canvas-quick-actions"
  repoFiles={['src/app/pages/fundamentals/controls/context-menus-canvas-quick-actions.component.ts']}
/>

Items can also call into clipboard methods such as `copy`, `paste`, and `delete`, wiring the menu to the same actions available from keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/context-menus-clipboard-actions"
  repoFiles={['src/app/pages/fundamentals/controls/context-menus-clipboard-actions.component.ts']}
/>

Use `group` to cluster related entries with a separator, and `children` to nest a submenu of arbitrary depth for actions that don't need a top-level entry.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/context-menus-object-inspector"
  repoFiles={['src/app/pages/fundamentals/controls/context-menus-object-inspector.component.ts']}
/>

The optional `isVisible` and `isDisabled` conditions accept booleans or async functions, so entries can react to editor state, such as disabling "Select All" when the viewport is empty.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/context-menus-smart-conditional"
  repoFiles={['src/app/pages/fundamentals/controls/context-menus-smart-conditional.component.ts']}
/>

## More Menu

The more menu in the top-right corner groups secondary editor actions. Set `isMoreMenuVisible` to `false` in order to hide it. Call `openMoreMenu()` to programmatically open it. Pass an array of menu items to the `moreMenuItems` prop to dynamically configure the items shown in the menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/more-menu-open"
  repoFiles={['src/app/pages/fundamentals/controls/more-menu-open.component.ts']}
/>

## Export Dialog

The export dialog allows users to save the current viewport as an image or export the current workspace as JSON. You can either open it as part of the default more menu or trigger it programmatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/export-dialog"
  repoFiles={['src/app/pages/fundamentals/controls/export-dialog.component.ts']}
/>

## Import Dialog

The import dialog allows users load a workspace stored as JSON. You can either open it as part of the default more menu or trigger it programmatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/import-dialog"
  repoFiles={['src/app/pages/fundamentals/controls/import-dialog.component.ts']}
/>

## Zoom Panel

The zoom panel shows the current zoom level and provides zoom-in and zoom-out buttons. Set `isZoomPanelVisible` to `false` in order to hide it. On small screens, the zoom panel is automatically hidden to save space.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/zoom-panel-toggle"
  repoFiles={['src/app/pages/fundamentals/controls/zoom-panel-toggle.component.ts']}
/>

## Notifications

Call `triggerNotification()` to display a transient message in the editor. Notifications have `info`, `warning`, and `error` types, allowing your application to provide feedback without building a separate notification surface.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/fundamentals/controls/notifications-trigger"
  repoFiles={['src/app/pages/fundamentals/controls/notifications-trigger.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor UI Elements](../api-reference/editor.md#ui-elements)
- [Editor Object Titlebar](../api-reference/editor.md#object-titlebar)
- [Configuring Objects](./objects.md#configuring-objects)
- [Titlebar Theming](../api-reference/theming.md#titlebar)