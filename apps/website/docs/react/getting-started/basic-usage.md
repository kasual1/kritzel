---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Upmade for React"
description: "Learn the main ways to interact with Upmade from React: set props, listen to events, and call public methods."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

## Overview

For most use cases `<UpmadeEditor>` is the preferred choice. It gives you a ready-made whiteboard experience and includes customizable controls that can be further tuned to your needs. Only use `<UpmadeEngine>` when you want to build the entire UI yourself.

Once `<UpmadeEditor>` or `<UpmadeEngine>` is rendering in your application, you can interact with the canvas in three complementary ways:

- **Setting props** to configure the component declaratively.
- **Listening to events** to react to changes from the editor or engine.
- **Calling methods** to make imperative changes or query state.

While `<UpmadeEditor>` is the main way to integrate Upmade into your application, the same APIs also apply to `<UpmadeEngine>`. The examples below focus on `<UpmadeEditor>`, but the concepts carry over to the engine as well.

For the full documentation, please see the API reference of the [Editor](../api-reference/editor.md) or the [Engine](../api-reference/engine.md).

## Waiting for Initialization

Before interacting with an editor instance through its public API, you must wait for the editor's `isReady` event. `<UpmadeEditor>` emits `isReady` after the engine is mounted, the internal rendering context is created, and the initial workspace state is available.

```tsx
import { useRef } from 'react';
import { UpmadeEditor, type HTMLUpmadeEditorElement } from '@upmade/react-editor';

export function App() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    await editor.setActiveTool('brush');
  }

  return <UpmadeEditor ref={editorRef} onIsReady={() => void onReady()} />;
}
```

Only call methods such as `setActiveTool` after the editor has emitted the `isReady` event.

## Setting Props

Props are the declarative way to configure the editor. Use props such as `theme`, `scaleMin`, `syncConfig`, and `isToolbarVisible` to customize editor behavior and the built-in UI.

```tsx
import { useState } from 'react';
import { UpmadeEditor } from '@upmade/react-editor';

export function Canvas() {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  return (
    <>
      <button onClick={() => setIsToolbarVisible((visible) => !visible)}>
        Toggle toolbar
      </button>
      <UpmadeEditor isToolbarVisible={isToolbarVisible} />
    </>
  );
}
```

For example, changing `isToolbarVisible` from application state hides or shows the editor's toolbar.

## Listening to Events

Events are the way the editor reports state changes. Pass event callbacks as `on`-prefixed props and read their payload from `event.detail`. The payload type depends on the event; for example, `objectsChange` contains the current objects and `viewportChange` contains the current viewport state.

```tsx
import {
  UpmadeBaseObject,
  UpmadeEditor,
  UpmadeViewportState,
} from '@upmade/react-editor';

function onObjectsChange(event: CustomEvent<UpmadeBaseObject[]>) {
  console.log('Canvas objects updated:', event.detail.length);
}

function onViewportChange(event: CustomEvent<UpmadeViewportState>) {
  console.log('Viewport updated:', event.detail);
}

export function Canvas() {
  return (
    <UpmadeEditor
      onObjectsChange={onObjectsChange}
      onViewportChange={onViewportChange}
    />
  );
}
```

The `isReady` event is also an event you can listen to. Treat it as the point at which code that calls the editor's public methods may start running.

## Calling Methods

Public methods are the imperative way to control the editor canvas and query its state. Upmade methods are asynchronous and return Promises, so call them from an `async` function and `await` their results. The element reference must be ready before these calls are made. The following example demonstrates adding a text object programmatically.

```tsx
import { useRef } from 'react';
import {
  UpmadeEditor,
  UpmadeText,
  type HTMLUpmadeEditorElement,
} from '@upmade/react-editor';

export function Canvas() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);

  async function addText() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    await editor.addObject(new UpmadeText({
      text: 'Programmatic text!',
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: 'Arial',
      fontColor: { light: '#ff0000', dark: '#ff6666' },
    }));
  }

  return (
    <>
      <button onClick={() => void addText()}>Add text</button>
      <UpmadeEditor ref={editorRef} />
    </>
  );
}
```

Other object, tool, and viewport methods follow the same asynchronous pattern.

## Basic Usage Example

Below is a complete example combining props, events, and public methods. It uses the editor's custom toolbar to trigger methods, inserts programmatic text, zooms the viewport, and displays a dynamic object count from an event.

<LiveDemo
  repoUrl="https://github.com/kasual1/upmade/tree/main/apps/demos/react"
  repoFiles={['src/pages/getting-started/BasicUsagePage.tsx']}
  demoPath="/getting-started/basic-usage"
/>