---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Kritzel for Angular"
description: "Learn the main ways to interact with Kritzel from Angular: set props, listen to events, and call public methods."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

Once `<kritzel-editor>` or `<kritzel-engine>` is rendering in your application, you can interact with the canvas in three complementary ways:

- **Setting props** to configure the component declaratively.
- **Listening to events** to react to changes from the editor or engine.
- **Calling methods** to make imperative changes or query state.

The headless Engine provides the same core canvas API as the editor, but without the built-in UI elements. The examples below use `<kritzel-editor>`, but the object, viewport, tool, and workspace APIs also apply to `<kritzel-engine>`.

For more detailed documentation, take a look at the [Editor](../../fundamentals/components/editor/) or the [Engine](../../fundamentals/components/engine/). 
 

## Waiting for the Editor to be Ready

Before interacting with an editor instance through its public API, you must wait for the editor's `isReady` event. The `<kritzel-editor>` emits `isReady` after the engine is mounted, the internal rendering context is created, and the initial workspace state is available. This is especially important when obtaining the element with `ViewChild` and calling methods from your component.

```ts
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<kritzel-editor #editor (isReady)="onReady()"></kritzel-editor>`
})
export class AppComponent {
  @ViewChild('editor') editorRef!: ElementRef<HTMLKritzelEditorElement>;

  onReady() {
    const editor = this.editorRef.nativeElement;
    editor.changeActiveTool('brush');
  }
}
```

Do not call methods such as `changeActiveTool`, `addObject`, or `setViewport` before this event. Props that are bound in the template can be supplied as part of Angular's normal component setup, but imperative access to the editor should begin only after `isReady` has fired.

## Setting Props

Props are the declarative way to configure the editor. Bind Angular component values with square-bracket syntax. Use props such as `theme`, `scaleMin`, `syncConfig`, and `isToolbarVisible` to customize editor behavior and the built-in UI.

```ts
import { Component } from '@angular/core';
import { KritzelEditor, KritzelSyncConfig } from 'kritzel-angular';

@Component({
  selector: 'app-canvas',
  imports: [KritzelEditor],
  template: `
    <kritzel-editor [isToolbarVisible]="isToolbarVisible"></kritzel-editor>
  `,
})
export class CanvasComponent {
  isToolbarVisible = true;
}
```

For example, changing `showToolbar` from application state updates the editor without calling a method.

## Listening to Events

Events are the way the editor reports state changes. Bind custom-element events in the template and read their payload from `event.detail`. The payload type depends on the event; for example, `objectsChange` contains the current objects and `viewportChange` contains the current viewport state.

```html
<kritzel-editor
  (objectsChange)="onObjectsChange($event)"
  (viewportChange)="onViewportChange($event)">
</kritzel-editor>
```

```ts
import { KritzelBaseObject, KritzelViewportState } from 'kritzel-angular';

onObjectsChange(event: Event) {
  const objects = (event as CustomEvent<KritzelBaseObject[]>).detail;
  console.log('Canvas objects updated:', objects.length);
}

onViewportChange(event: Event) {
  const viewport = (event as CustomEvent<KritzelViewportState>).detail;
  console.log('Viewport updated:', viewport);
}
```

The `isReady` event is also an event you can listen to. Treat it as the point at which code that calls the editor's public methods may start running.

## Calling Methods

Public methods are the imperative way to control the editor canvas and query its state. Kritzel methods are asynchronous and return Promises, so call them from an `async` function and `await` their results. The element reference must be ready before these calls are made. The following example demonstrates adding a text object programmatically.

```ts
import { KritzelText } from 'kritzel-angular';

async addText() {
  await this.editor.addObject(new KritzelText({
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

## Interactive Basic Usage Example

Below is a complete example combining props, events, and public methods. It uses the Editor's custom toolbar to trigger methods, inserts programmatic text, zooms the viewport, and displays a dynamic object count from an event.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  repoFiles={['src/app/getting-started/basic-usage.component.ts']}
  demoPath="/getting-started/basic-usage"
/>