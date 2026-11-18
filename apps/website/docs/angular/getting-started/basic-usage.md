---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Upmade for Angular"
description: "Learn the main ways to interact with Upmade from Angular: set props, listen to events, and call public methods."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

## Overview

For most use cases `<upmade-editor>` is the preferred choice. It gives you a ready made whiteboard experience and includes customizable controls that can be further tuned to your needs. Only use `<upmade-engine>` when you want to build the entire UI yourself.

Once `<upmade-editor>` or `<upmade-engine>` is rendering in your application, you can interact with the canvas in three complementary ways:

- **Setting props** to configure the component declaratively.
- **Listening to events** to react to changes from the editor or engine.
- **Calling methods** to make imperative changes or query state.

While the `<upmade-editor>` is the main way to integrate Upmade into your application, the same APIs also apply to `<upmade-engine>`. The examples below focus on `<upmade-editor>`, but the concepts carry over to the engine as well.

For the full documentation, please see the API reference of the [Editor](../api-reference/editor.md) or the [Engine](../api-reference/engine.md).

## Waiting for Initialization

Before interacting with an editor instance through its public API, you must wait for the editor's `isReady` event. The `<upmade-editor>` emits `isReady` after the engine is mounted, the internal rendering context is created, and the initial workspace state is available.

```ts
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<upmade-editor #editor (isReady)="onReady()"></upmade-editor>`
})
export class AppComponent {
  @ViewChild(UpmadeEditor) editor!: UpmadeEditor;

  onReady() {
    this.editor.setActiveTool('brush');
  }
}
```

Only call methods such as `setActiveTool` after the editor has emitted the `isReady` event.

## Setting Props

Props are the declarative way to configure the editor. Use props such as `theme`, `scaleMin`, `syncConfig`, and `isToolbarVisible` to customize editor behavior and the built-in UI.

```ts
import { Component } from '@angular/core';
import { UpmadeEditor, UpmadeSyncConfig } from '@upmade/angular-editor';

@Component({
  selector: 'app-canvas',
  imports: [UpmadeEditor],
  template: `
    <upmade-editor [isToolbarVisible]="isToolbarVisible"></upmade-editor>
  `,
})
export class CanvasComponent {
  isToolbarVisible = false;
}
```

For example, changing `isToolbarVisible` from application state hides the editor's toolbar.

## Listening to Events

Events are the way the editor reports state changes. Bind custom-element events in the template and read their payload from `event.detail`. The payload type depends on the event; for example, `objectsChange` contains the current objects and `viewportChange` contains the current viewport state.

```html
<upmade-editor
  (objectsChange)="onObjectsChange($event)"
  (viewportChange)="onViewportChange($event)">
</upmade-editor>
```

```ts
import { UpmadeBaseObject, UpmadeViewportState } from '@upmade/angular-editor';

onObjectsChange(event: Event) {
  const objects = (event as CustomEvent<UpmadeBaseObject[]>).detail;
  console.log('Canvas objects updated:', objects.length);
}

onViewportChange(event: Event) {
  const viewport = (event as CustomEvent<UpmadeViewportState>).detail;
  console.log('Viewport updated:', viewport);
}
```

The `isReady` event is also an event you can listen to. Treat it as the point at which code that calls the editor's public methods may start running.

## Calling Methods

Public methods are the imperative way to control the editor canvas and query its state. Upmade methods are asynchronous and return Promises, so call them from an `async` function and `await` their results. The element reference must be ready before these calls are made. The following example demonstrates adding a text object programmatically.

```ts
import { UpmadeText } from '@upmade/angular-editor';

async addText() {
  await this.editor.addObject(new UpmadeText({
    text: 'Programmatic text!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: { light: '#ff0000', dark: '#ff6666' },
  }));
}
```

Other object, tool, and viewport methods follow the same asynchronous pattern.

## Basic Usage Example

Below is a complete example combining props, events, and public methods. It uses the Editor's custom toolbar to trigger methods, inserts programmatic text, zooms the viewport, and displays a dynamic object count from an event.

<LiveDemo
  repoUrl="https://github.com/kasual1/upmade/tree/main/apps/demos/angular"
  repoFiles={['src/app/pages/getting-started/basic-usage.component.ts']}
  demoPath="/getting-started/basic-usage"
/>