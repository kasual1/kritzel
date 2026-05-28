---
sidebar_label: Custom Context Menu
displayed_sidebar: tutorialSidebar
title: "Custom Context Menu Example | Kritzel for Angular"
description: "Build a custom Kritzel context menu for real-world scenarios — from minimal canvas actions to a full object inspector with submenus, conditional visibility, and async state."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Context Menu

This page shows how to configure the `globalContextMenuItems` and `objectContextMenuItems` inputs on `<kritzel-editor>` for different real-world scenarios. Each example is self-contained and ready to copy into your project.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How the Context Menu Works

The context menu is controlled by two inputs on `<kritzel-editor>`:

- **`globalContextMenuItems`** — the items shown when the user right-clicks on the empty canvas (no object under the cursor).
- **`objectContextMenuItems`** — the items shown when the user right-clicks on selected objects.

Both accept an array of `ContextMenuItem` objects:

```ts
import { ContextMenuItem } from 'kritzel-stencil';

interface ContextMenuItem {
  label: string;
  action?: (menu: { x: number; y: number }, objects: KritzelBaseObject[]) => void;
  icon?: string;
  group?: string;
  children?: ContextMenuItem[];
  visible?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
  disabled?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
}
```

Passing either input replaces the corresponding default set entirely. Omitting an input keeps that default set intact. Passing an empty array (`[]`) hides that menu entirely — no context menu will appear for the canvas or the object respectively.

---

## Canvas-Level Quick Actions

A minimal setup for a document viewer or read-only annotation tool: right-clicking the empty canvas offers Paste and Select All. The object menu is disabled entirely by passing an empty array, keeping the interaction focused on canvas-level actions.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-canvas-quick-actions"
  repoFiles={['src/app/examples/custom-context-menu/custom-context-menu-canvas-quick-actions.component.ts']}
/>

The `action` callback receives the screen-space position of the menu (`menu.x`, `menu.y`) and the array of currently selected objects. For canvas-level items, `objects` is always empty. Setting `objectContextMenuItems` to `[]` suppresses the default object menu entirely.

---

## Clipboard and Object Actions

A standard whiteboard setup with separate menus for canvas and objects. The canvas menu handles paste and bulk selection, while the object menu provides copy, paste, and delete — grouped visually using the `group` property and decorated with `icon` for quick scanning.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-clipboard-actions"
  repoFiles={['src/app/examples/custom-context-menu/custom-context-menu-clipboard-actions.component.ts']}
/>

Items sharing the same `group` string are visually separated from other groups by a divider line. The `icon` value is a built-in icon name. Custom SVG icons registered via the `customSvgIcons` input on `<kritzel-editor>` are also available here by their registered key.

---

## Smart Conditional Menu

A production-ready menu that reacts to editor state: Paste is disabled when the clipboard is empty, Select All is disabled when the viewport has no objects, and Export as PNG only appears when exactly one object is selected. This prevents user confusion by hiding or greying out actions that cannot succeed.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-smart-conditional"
  repoFiles={['src/app/examples/custom-context-menu/custom-context-menu-smart-conditional.component.ts']}
/>

Both `disabled` and `visible` accept a function returning `boolean` or `Promise<boolean>`. The menu waits for all promises to resolve before rendering. Use `disabled` for items that should remain visible but un-clickable, and `visible` for items that should be hidden entirely based on context.

---

## Object Inspector Menu with Submenus

A full-featured object menu for a design tool: clipboard actions at the top, a nested Arrange submenu for layer ordering (Bring to Front, Send to Back, etc.), a nested Export submenu offering PNG and SVG formats, and a destructive Delete action at the bottom. Submenus can be nested to any depth.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-object-inspector"
  repoFiles={['src/app/examples/custom-context-menu/custom-context-menu-object-inspector.component.ts']}
/>

Add `children` to an item to turn it into a submenu trigger — the item itself has no `action`. Clicking or hovering over it opens the nested list. The menu automatically handles positioning to ensure submenus are always fully visible within the viewport.
