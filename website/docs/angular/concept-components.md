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
  demoPath="/fundamentals/components-editor"
  repoFiles={['src/app/fundamentals/components/components-editor.component.ts']}
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
  demoPath="/fundamentals/components-editor-ui"
  repoFiles={['src/app/fundamentals/components/components-editor-ui.component.ts']}
/>


## Using the Engine Component

When you need a deeply custom application without built-in UI chrome, use the `<kritzel-engine>`. You can build your own HTML/CSS UI around it and drive the Engine entirely via its programmatic API. The demo below demonstrates how to bind external standard HTML buttons to the headless Engine.

Unlike the Editor, the Engine **does not register any drawing tools by default**. The Editor automatically registers tools through its built-in `<kritzel-controls>` toolbar component. When using the Engine directly, you must call `registerTool()` for each tool you want to use before calling `changeActiveTool()` or `changeActiveToolByName()`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components-engine"
  repoFiles={['src/app/fundamentals/components/components-engine.component.ts']}
/>

## Related API Methods

Since both components share the same API surface for interacting with the whiteboard state, you can use these methods and properties on both:
- Tool registration and selection ([registerTool](api-reference-editor.md#registertool), [changeActiveTool](api-reference-editor.md#changeactivetool), [changeActiveToolByName](api-reference-editor.md#changeactivetoolbyname))
- Viewport and boundaries ([viewportBoundaryLeft](api-reference-editor.md#props), [viewportBoundaryRight](api-reference-editor.md#props), [scaleMin](api-reference-editor.md#props), [scaleMax](api-reference-editor.md#props))
- Theme management ([theme](api-reference-editor.md#props) property)
- Context menu configuration ([globalContextMenuItems](api-reference-editor.md#props), [objectContextMenuItems](api-reference-editor.md#props))
- Editor-specific options like [isControlsVisible](api-reference-editor.md#props) or [isUtilityPanelVisible](api-reference-editor.md#props) (Editor only)

For a comprehensive view, see the [API Reference](api-reference-editor.md).


