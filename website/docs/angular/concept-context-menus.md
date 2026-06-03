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

## Canvas-Level Actions

This focused setup uses a minimal canvas menu for quick document commands. It is useful for viewer-like experiences where users mostly interact with the board as a whole rather than individual objects.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/context-menus-canvas-quick-actions"
  repoFiles={['src/app/concepts/context-menus/custom-context-menu-canvas-quick-actions.component.ts']}
/>

## Clipboard and Object Actions

This example separates canvas actions from object actions and adds visual grouping. It demonstrates a practical baseline for whiteboard workflows where copy, paste, and delete are frequently used.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/context-menus-clipboard-actions"
  repoFiles={['src/app/concepts/context-menus/custom-context-menu-clipboard-actions.component.ts']}
/>

## Conditional Menu State

This demo shows state-aware menus where items are hidden or disabled until actions become valid. It reduces user friction by exposing only what can currently succeed.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/context-menus-smart-conditional"
  repoFiles={['src/app/concepts/context-menus/custom-context-menu-smart-conditional.component.ts']}
/>

## Nested Menu Hierarchies

This configuration uses `children` to create submenus for structured action groups like Arrange and Export. It is a good fit for design tools where many object-specific actions need to remain organized.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/context-menus-object-inspector"
  repoFiles={['src/app/concepts/context-menus/custom-context-menu-object-inspector.component.ts']}
/>

## Related API Methods

- Canvas menu configuration (`globalContextMenuItems`)
- Object menu configuration (`objectContextMenuItems`)
- Conditional behavior (`visible`, `disabled`)
- Action handlers (`action`)
- Grouping and hierarchy (`group`, `children`, `icon`)

For a comprehensive view, see the [API Reference](api-reference-editor.md).