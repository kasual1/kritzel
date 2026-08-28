---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Kritzel for Angular"
description: "Learn the main ways to interact with Kritzel from Angular: set props, listen to events, and call public methods."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

Once `<kritzel-editor>` or `<kritzel-engine>` is rendering in your application, you can interact with the canvas in three complementary ways:

- **Set props** to configure the component declaratively.
- **Listen to events** to react to changes from the editor or engine.
- **Call public methods** to make imperative changes or query state.

The headless Engine provides the same core canvas API as the editor, but without the built-in UI elements. The examples below use `<kritzel-editor>`, but the object, viewport, tool, and workspace APIs also apply to `<kritzel-engine>`.

For more detailed documentation, take a look at the [Editor ](../../fundamentals/components/editor.md) or the [Engine](../../fundamentals/components/engine.md). 
 

## Wait for the Editor's isReady Event

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

## Set Props

Props are the declarative way to configure an editor or engine. Bind Angular component values with square-bracket syntax. Use shared props such as `theme`, `scaleMin`, and `syncConfig` on either component, and use Editor-only props such as `isToolbarVisible` when you need to customize the built-in UI.

```ts
import { Component } from '@angular/core';
import { KritzelEditor, KritzelSyncConfig } from 'kritzel-angular';

@Component({
  selector: 'app-canvas',
  imports: [KritzelEditor],
  template: `
    <kritzel-editor
      [theme]="theme"
      [isToolbarVisible]="showToolbar"
      [syncConfig]="syncConfig">
    </kritzel-editor>
  `,
})
export class CanvasComponent {
  theme = 'light';
  showToolbar = true;
  syncConfig: KritzelSyncConfig = { providers: [] };
}
```

For example, changing `showToolbar` from application state updates the Editor without calling a method. The Engine accepts the shared configuration props, but it does not render the Editor's toolbar or other built-in UI.

## Listen to Events

Events are the way Kritzel reports state changes to your Angular component. Bind custom-element events in the template and read their payload from `event.detail`. The payload type depends on the event; for example, `objectsChange` contains the current objects and `viewportChange` contains the current viewport state.

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

The `isReady` event is also an event you can listen to. Treat it as the point at which code that calls the Editor's public methods may start running. Events such as `objectsChange` are available on both the Editor and Engine; UI-specific events are available only on the Editor.

## Call Public Methods

Public methods are the imperative way to control the canvas and query its state. Kritzel methods are asynchronous and return Promises, so call them from an `async` function and `await` their results. The element reference must be ready before these calls are made.

```ts
import { KritzelText } from 'kritzel-angular';

async updateCanvas() {
  await this.editor.changeActiveTool('brush');
  await this.editor.addObject(new KritzelText({
    text: 'Programmatic text!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: { light: '#ff0000', dark: '#ff6666' },
  }));
  await this.editor.zoomTo(1.5);
  return this.editor.getAllObjects();
}
```

The same pattern applies to object lifecycle methods such as `addObject`, `updateObject`, `removeObject`, and `getAllObjects`; tool methods such as `changeActiveTool`; and viewport methods such as `setViewport`, `zoomTo`, and `centerObjectInViewport`. The Editor and Engine expose these shared methods through their element references.

## Interactive Basic Usage Example

Below is a complete example combining props, events, and public methods. It uses the Editor's custom toolbar to trigger methods, inserts programmatic text, zooms the viewport, and displays a dynamic object count from an event.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  repoFiles={['src/app/getting-started/basic-usage.component.ts']}
  demoPath="/getting-started/basic-usage"
/>