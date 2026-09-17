---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Kritzel for React"
description: "Programmatically interact with the Kritzel editor instance in your React app: load objects, change tools, and respond to events."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

Once you have `<KritzelEditor>` rendering in your application, you can start interacting with the canvas programmatically. The editor acts as a stateful engine: it manages the view, drawing state, and objects internally, exposing its outward state through DOM events and providing asynchronous methods for programmatic mutations.

## Understanding the Editor Lifecycle

Before making API calls, you must wait for the editor to fully initialize. The `<KritzelEditor>` emits an `isReady` event when the engine is mounted, the internal rendering context is created, and default workspaces are loaded.

```tsx
import { useEffect, useRef } from 'react';
import { KritzelEditor, EditorIsReadyEvent } from '@kritzel/react-editor';

export function App() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleReady = (event: Event) => {
      const detail = (event as CustomEvent<EditorIsReadyEvent>).detail;
      console.log('Editor is fully initialized and ready!', detail.activeWorkspace);
    };

    editor.addEventListener('isReady', handleReady);
    return () => editor.removeEventListener('isReady', handleReady);
  }, []);

  return <KritzelEditor ref={editorRef} style={{ display: 'block', width: '100%', height: '100vh' }} />;
}
```

## Changing Tools Programmatically

The default editor toolbar registers these built-in tools: `selection`, `brush`, `eraser`, `line`, `shape`, `text`, and `image`. You can programmatically switch between them using the `setActiveTool` method — the name must match the tool's registered name (the `name` of the corresponding `toolbarItems` entry when you customize the toolbar). All editor mutations are asynchronous.

```tsx
async function setBrushTool(editor: HTMLKritzelEditorElement | null) {
  if (editor) {
    await editor.setActiveTool('brush');
  }
}

async function setSelectionTool(editor: HTMLKritzelEditorElement | null) {
  if (editor) {
    await editor.setActiveTool('selection');
  }
}
```

## Working with the Object Model

Kritzel elements on the canvas, such as shapes, text, and drawings, are represented as objects. You can listen to `objectsChange` to sync external UI like a layer panel or status bar, and use API methods to query or manipulate objects.

For instance, adding a text element programmatically:

```tsx
import { KritzelText } from '@kritzel/react-editor';

async function addText(editor: HTMLKritzelEditorElement | null) {
  if (!editor) return;

  const text = new KritzelText({
    text: 'Programmatic text!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: { light: '#ff0000', dark: '#ff6666' },
  });

  await editor.addObject(text);
  await editor.selectObjects([text]);
}
```

## Interacting with the Viewport

The editor allows you to programmatically control the viewport, or camera, to zoom, pan, or center on specific coordinates or objects.

```tsx
async function zoomIn(editor: HTMLKritzelEditorElement | null) {
  if (editor) {
    await editor.zoomTo(1.5);
  }
}

async function focusOnObject(editor: HTMLKritzelEditorElement | null, targetObject: any) {
  if (editor) {
    await editor.centerObjectInViewport(targetObject);
  }
}
```

## Listening to Events

Bind to DOM events on the custom element `<KritzelEditor>` to stay updated on canvas changes.

```tsx
import { useEffect, useRef } from 'react';
import { KritzelEditor, KritzelBaseObject } from '@kritzel/react-editor';

export function CanvasStatus() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const onObjectsChange = (event: Event) => {
      const objects = (event as CustomEvent<KritzelBaseObject[]>).detail;
      console.log('Canvas objects updated:', objects.length);
    };

    const onViewportChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log('Viewport updated:', detail);
    };

    editor.addEventListener('objectsChange', onObjectsChange);
    editor.addEventListener('viewportChange', onViewportChange);

    return () => {
      editor.removeEventListener('objectsChange', onObjectsChange);
      editor.removeEventListener('viewportChange', onViewportChange);
    };
  }, []);

  return <KritzelEditor ref={editorRef} style={{ display: 'block', width: '100%', height: '100vh' }} />;
}
```

## Interactive Basic Usage Example

Below is a complete example combining everything covered in this guide. It provides a simple custom toolbar to trigger tools, insert programmatic text, zoom into the canvas, and displays a dynamic counter of the total objects.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  repoFiles={['src/pages/getting-started/BasicUsagePage.tsx']}
  demoPath="/getting-started/basic-usage"
/>