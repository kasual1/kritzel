---
sidebar_label: Components
displayed_sidebar: tutorialSidebar
title: "Components Concept | Kritzel for React"
description: "Understand the core concept of Components in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Components

## Overview

Kritzel is built around two primary components that serve different architectural needs depending on your application. `<KritzelEditor>` is a high-level, batteries-included component providing a complete whiteboard UI, while `<KritzelEngine>` is a headless rendering primitive for deeply custom integrations. Both components share an identical public API exposing asynchronous methods (returning Promises) for managing state, viewports, tools, and objects.

## Using the Editor Component

When you want a complete whiteboard experience out of the box, use `<KritzelEditor>`. It includes toolbars, utility panels, context menus, and settings dialogs, which can be configured via props.

### Basic Initialization

The basic implementation of the Editor requires zero configuration. You simply render the component, and a fully functional whiteboard will fit its container.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/components-editor"
  repoFiles={['src/pages/fundamentals/components/components-editor.tsx']}
/>

### Waiting for Initialization

Because Kritzel performs asynchronous setup tasks internally (such as creating canvas elements and syncing state), you must wait for the `onIsReady` callback before calling programmatic API methods:

```tsx
import { useRef } from 'react';
import { KritzelEditor } from 'kritzel-react';

export function MyComponent() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function onEditorReady() {
    await editorRef.current?.setViewport({ pan: { x: 0, y: 0 }, zoom: 1 });
  }

  return <KritzelEditor ref={editorRef} onIsReady={() => void onEditorReady()} />;
}
```

### Customizing the Editor UI

You can toggle visibility for built-in UI components using props. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to `false` hides both areas and creates a more minimal interface while retaining all core whiteboard functionality.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/components-editor-ui"
  repoFiles={['src/pages/fundamentals/components/components-editor-ui.tsx']}
/>

## Using the Engine Component

When you need a deeply custom application without built-in UI chrome, use `<KritzelEngine>`. You can build your own HTML and CSS UI around it and drive the Engine entirely via its programmatic API. The demo below shows how to bind external standard HTML buttons to the headless Engine.

Unlike the Editor, the Engine **does not register any drawing tools by default**. The Editor automatically registers tools through its built-in controls. When using the Engine directly, you must call `registerTool()` for each tool you want to use before calling `changeActiveTool()` or `changeActiveToolByName()`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/components-engine"
  repoFiles={['src/pages/fundamentals/components/components-engine.tsx']}
/>

## Related API Methods

Since both components share the same API surface for interacting with whiteboard state, you can use these methods and properties on both:

- Viewport and boundaries (`viewportBoundaryLeft`, `viewportBoundaryRight`, `scaleMin`, `scaleMax`)
- Theme management (`theme` prop)
- Context menu configuration (`globalContextMenuItems`, `objectContextMenuItems`)
- Editor-specific options like `isControlsVisible` or `isUtilityPanelVisible` (Editor only)

For a comprehensive view, see the [API Reference](api-reference-editor.md).