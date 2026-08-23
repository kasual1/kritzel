---
sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor Concept | Kritzel for Angular"
description: "Understand the Kritzel Editor component, a batteries-included whiteboard UI."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Editor

## Overview

The `<kritzel-editor>` is a high-level, "batteries-included" component providing a complete whiteboard UI, including toolbars, utility panels, context menus, and settings dialogs. It shares its entire programmatic API (asynchronous methods returning Promises for managing state, viewports, tools, and objects) with its headless sibling, the [Engine](../components/concept-engine.md), so the two are interchangeable at the API level and differ only in built-in UI chrome.

## Basic Initialization

The basic implementation of the Editor requires zero configuration. You simply drop the tag into your template, and a fully functional whiteboard will render to fit its container.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components-editor"
  repoFiles={['src/app/fundamentals/components/components-editor.component.ts']}
/>

## Waiting for Initialization

Because Kritzel performs asynchronous setup tasks internally (such as instantiating canvas elements and syncing state), you must wait for the `(isReady)` event before calling programmatic API methods. Bind the event in your template:

```html
<kritzel-editor (isReady)="onEditorReady($event)"></kritzel-editor>
```

Then, in your component controller, you can safely interact with the Editor's API once the handler fires:

```typescript
import { Component } from '@angular/core';

@Component({ ... })
export class MyComponent {
  onEditorReady(event: Event) {
    // It's now safe to call API methods like addWorkspace(), registerTool(), etc.
    const editor = event.target as HTMLKritzelEditorElement;
    editor.setViewport({ pan: { x: 0, y: 0 }, zoom: 1 });
  }
}
```

## Customizing the Editor UI

Beyond toggling whole panels, the Editor exposes two independent customization surfaces: simple visibility flags for its built-in chrome, and fully custom context menus for canvas and object interactions.

### Toggling Built-in UI Chrome

You can toggle visibility for built-in UI components using the Editor's attributes. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to false will not render the workspace manager at the top left nor the more menu at the top right, giving you a more minimal interface while retaining all core whiteboard functionality. `isControlsVisible` and `isUtilityPanelVisible` work the same way for the tool toolbar and the utility panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components-editor-ui"
  repoFiles={['src/app/fundamentals/components/components-editor-ui.component.ts']}
/>

### Configuring Context Menus

The Editor separates right-click actions into two arrays: `globalContextMenuItems` for empty-canvas interactions, and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, an `action` handler, and optional `visible`/`disabled` conditions so entries can react to editor state, plus `group` and `children` for grouping and nested submenus.

```ts
editor.globalContextMenuItems = [
  { label: 'Export as PNG', icon: 'export', action: () => editor.exportAsPng() },
];
```

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/context-menus-canvas-quick-actions"
  repoFiles={['src/app/advanced/context-menus/custom-context-menu-canvas-quick-actions.component.ts']}
/>

## Related API Methods

- Tool registration and selection ([registerTool](../api-reference-editor.md#registertool), [changeActiveTool](../api-reference-editor.md#changeactivetool), [changeActiveToolByName](../api-reference-editor.md#changeactivetoolbyname))
- Viewport and boundaries ([viewportBoundaryLeft](../api-reference-editor.md#props), [viewportBoundaryRight](../api-reference-editor.md#props), [scaleMin](../api-reference-editor.md#props), [scaleMax](../api-reference-editor.md#props))
- Theme management ([theme](../api-reference-editor.md#props) property)
- Context menu configuration ([globalContextMenuItems](../api-reference-editor.md#props), [objectContextMenuItems](../api-reference-editor.md#props))
- Editor-only UI options ([isControlsVisible](../api-reference-editor.md#props), [isUtilityPanelVisible](../api-reference-editor.md#props), [isWorkspaceManagerVisible](../api-reference-editor.md#props), [isMoreMenuVisible](../api-reference-editor.md#props))

For a comprehensive view, see the [API Reference](../api-reference-editor.md).
