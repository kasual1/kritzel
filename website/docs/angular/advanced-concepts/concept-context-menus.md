---
sidebar_label: Context Menus
displayed_sidebar: tutorialSidebar
title: "Context Menus Concept | Kritzel for Angular"
description: "Understand the core concept of Context Menus in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Context Menus

## Overview

Context menus in Kritzel define which actions are available at the exact point where users interact with the canvas. The editor separates this into two surfaces: `globalContextMenuItems` for empty-canvas interactions and `objectContextMenuItems` for selected-object interactions.

This split lets you keep actions context-aware by default. A canvas click can expose navigation and document-level commands, while an object click can expose transformation, layering, export, or delete actions. With `visible` and `disabled`, menus can react to editor state before users execute an invalid command.

## Global Context Menu

This focused setup uses a minimal global context menu for quick document commands. It is triggered by right-clicking on an empty area of the canvas.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced-concepts/context-menus-canvas-quick-actions"
  repoFiles={['src/app/advanced-concepts/context-menus/custom-context-menu-canvas-quick-actions.component.ts']}
/>

## Object Context Menu

This example separates global context actions from object specific actions and adds visual grouping. It demonstrates a practical baseline for whiteboard workflows where copy, paste, and delete are frequently used. For the object context menu to appear, right-click directly on a selected object.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced-concepts/context-menus-clipboard-actions"
  repoFiles={['src/app/advanced-concepts/context-menus/custom-context-menu-clipboard-actions.component.ts']}
/>

## Conditional Menu State

This demo shows state-aware menus where items are hidden or disabled until actions become valid. It reduces user friction by exposing only what can currently succeed. The context menu below shows the "Export as PNG" action only when a single object is selected. And disables "Paste" until something is copied.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced-concepts/context-menus-smart-conditional"
  repoFiles={['src/app/advanced-concepts/context-menus/custom-context-menu-smart-conditional.component.ts']}
/>

## Nested Menu Hierarchies

This configuration uses `children` to create submenus for grouping related actions. Context menus support infinite nesting and automatically detect edge collisions to keep all items visible.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced-concepts/context-menus-object-inspector"
  repoFiles={['src/app/advanced-concepts/context-menus/custom-context-menu-object-inspector.component.ts']}
/>

## Related API Methods

- Canvas menu configuration ([globalContextMenuItems](../api-reference-editor.md#props))
- Object menu configuration ([objectContextMenuItems](../api-reference-editor.md#props))
- Programmatic control ([openContextMenu](../api-reference-editor.md#opencontextmenu), [hideContextMenu](../api-reference-editor.md#hidecontextmenu))
- Conditional behavior (`visible`, `disabled`)
- Action handlers (`action`)
- Grouping and hierarchy (`group`, `children`, `icon`)

For a comprehensive view, see the [API Reference](../api-reference-editor.md).