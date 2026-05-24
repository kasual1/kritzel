---
sidebar_label: Custom Context Menu
displayed_sidebar: tutorialSidebar
title: "Custom Context Menu Example | Kritzel for Angular"
description: "Build a custom Kritzel context menu step by step, from a minimal action list up to a fully structured menu with icons, groups, nested submenus, and async conditional items."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Context Menu

This guide builds up a custom context menu step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

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

## Step 1: Adding Items to the Canvas Menu

Pass a `globalContextMenuItems` array to replace the default canvas (empty-area) context menu. `objectContextMenuItems` is set to `[]` here to hide the default object menu while keeping the focus on the canvas menu:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-1"
  repoFiles={['src/app/examples/custom-context-menu-1.component.ts']}
/>

The `action` callback receives the screen-space position of the menu (`menu.x`, `menu.y`) and the array of currently selected objects (`objects`). For canvas-level items, `objects` is always empty.

---

## Step 2: Adding Items to the Object Menu

Add `objectContextMenuItems` to also replace the per-object context menu:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-2"
  repoFiles={['src/app/examples/custom-context-menu-2.component.ts']}
/>

When right-clicking a selected object, `objects` contains the currently selected objects. When right-clicking an unselected object, the editor first selects it, then populates `objects` with that single object.

---

## Step 3: Adding Icons and Visual Groups

Use `icon` and `group` to structure the menu visually. Items sharing the same `group` string are separated from other groups by a divider:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-3"
  repoFiles={['src/app/examples/custom-context-menu-3.component.ts']}
/>

The `icon` value is a built-in icon name. Custom SVG icons registered via the `customSvgIcons` input on `<kritzel-editor>` are also available here by their registered key.

---

## Step 4: Conditionally Disabling Items

Use a function for `disabled` to compute the enabled state at the moment the menu opens. In this example, **Select All** is disabled when there are no objects in the viewport, and **Paste** is disabled when the clipboard is empty (no objects have been copied yet):

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-4"
  repoFiles={['src/app/examples/custom-context-menu-4.component.ts']}
/>

`disabled` also accepts a plain `boolean` for statically disabled items.

---

## Step 5: Conditinonally Hiding Items

Similar to `disabled`, `visible` accepts functions that return a `Promise<boolean>`. The menu waits for all promises to resolve before rendering:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-5"
  repoFiles={['src/app/examples/custom-context-menu-5.component.ts']}
/>

`visible` controls whether the item appears in the list at all.

---

## Step 6: Nested Submenus

Add `children` to an item to turn it into a submenu trigger. The item itself has no `action`; clicking or hovering over it opens the nested list. Submenus can be nested to any depth. The menu automatically handles positioning to ensure submenus are always fully visible within the viewport.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-context-menu-6"
  repoFiles={['src/app/examples/custom-context-menu-6.component.ts']}
/>
