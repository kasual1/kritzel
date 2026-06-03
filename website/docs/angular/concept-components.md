---
sidebar_label: Components
displayed_sidebar: tutorialSidebar
title: "Components Concept | Kritzel for Angular"
description: "Understand the core concept of Components in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Components

## Overview

Kritzel is built around two primary web components that serve different architectural needs depending on your application. The `<kritzel-editor>` is a high-level, "batteries-included" component providing a complete whiteboard UI, while the `<kritzel-engine>` is a headless rendering primitive for deeply custom integrations. Both components share an identical public API exposing asynchronous methods (returning Promises) for managing state, viewports, tools, and objects.

## Using the Editor Component

When you want a complete whiteboard experience out-of-the-box, use the `<kritzel-editor>`. It includes toolbars, utility panels, context menus, and settings dialogs, which can be configured via properties.

### Basic Initialization

The basic implementation of the Editor requires zero configuration. You simply drop the tag into your template, and a fully functional whiteboard will render to fit its container.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/components-editor"
  repoFiles={['src/app/concepts/components/components-editor.component.ts']}
/>

### Waiting for Initialization

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

### Customizing the Editor UI

You can toggle visibility for built-in UI components using the Editor's attributes. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to false will not render the workspace manager at the top left nor the more menu at the top right, giving you a more minimal interface while retaining all core whiteboard functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/components-editor-ui"
  repoFiles={['src/app/concepts/components/components-editor-ui.component.ts']}
/>


## Using the Engine Component

When you need a deeply custom application without built-in UI chrome, use the `<kritzel-engine>`. You can build your own HTML/CSS UI around it and drive the Engine entirely via its programmatic API. The demo below demonstrates how to bind external standard HTML buttons to the headless Engine.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/components-engine"
  repoFiles={['src/app/concepts/components/components-engine.component.ts']}
/>

## Related API Methods

Since both components share the same API surface for interacting with the whiteboard state, you can use these methods and properties on both:
- Viewport and boundaries (`viewportBoundaryLeft`, `viewportBoundaryRight`, `scaleMin`, `scaleMax`)
- Theme management (`theme` property)
- Context menu configuration (`globalContextMenuItems`, `objectContextMenuItems`)
- Editor-specific options like `isControlsVisible` or `isUtilityPanelVisible` (Editor only)

For a comprehensive view, see the [API Reference](api-reference-editor.md).


