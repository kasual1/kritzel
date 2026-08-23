---

sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Kritzel for Angular"
description: "Programmatically interact with the Kritzel editor instance in your Angular app: load objects, change tools, and respond to events."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

Once you have `<kritzel-editor>` rendering in your application, you can start interacting with the canvas programmatically. The editor acts as a stateful engine: it manages the view, drawing state, and objects internally, exposing its outward state through DOM events and providing asynchronous methods for programmatic mutations.

## Understanding the Editor Lifecycle

Before making API calls, you must wait for the editor to fully initialize. The `<kritzel-editor>` emits an `isReady` event when the engine is mounted, the internal rendering context is created, and default workspaces are loaded.

```ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { EditorIsReadyEvent } from 'kritzel-angular';

@Component({
  selector: 'app-root',
  template: `<kritzel-editor #editor (isReady)="onReady($event)"></kritzel-editor>`
})
export class AppComponent {
  @ViewChild('editor') editorRef!: ElementRef<HTMLKritzelEditorElement>;

  get editor() {
    return this.editorRef?.nativeElement;
  }

  onReady(event: Event) {
    const detail = (event as CustomEvent<EditorIsReadyEvent>).detail;
    console.log('Editor is fully initialized and ready!', detail.activeWorkspace);
  }
}
```

## Changing Tools Programmatically

The default editor toolbar registers these built-in tools: `selection`, `brush`, `eraser`, `line`, `shape`, `text`, and `image`. You can programmatically switch between them using the `changeActiveToolByName` method — the name must match the tool's registered name (the `name` of the corresponding `toolbar` entry when you customize the toolbar). All editor mutations are asynchronous.

```ts
async setBrushTool() {
  if (this.editor) {
    await this.editor.changeActiveToolByName('brush');
  }
}

async setSelectionTool() {
  if (this.editor) {
    await this.editor.changeActiveToolByName('selection');
  }
}
```

## Working with the Object Model

Kritzel elements on the canvas (shapes, text, drawings) are represented as objects. You can listen to `objectsChange` to sync external UI (like a layer panel or status bar), and use API methods to query or manipulate objects.

For instance, adding a text element programmatically:

```ts
import { KritzelText } from "kritzel-angular";

async addText() {
  if (!this.editor) return;

  const text = new KritzelText({
    text: "Programmatic text!",
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: "Arial",
    fontColor: { light: "#ff0000", dark: "#ff6666" }
  });

  await this.editor.addObject(text);
  await this.editor.selectObjects([text]); 
}
```

## Interacting with the Viewport

The editor allows you to programmatically control the viewport (camera) to zoom, pan, or center on specific coordinates or objects.

```ts
async zoomIn() {
  if (this.editor) {
    await this.editor.zoomTo(1.5);
  }
}

async focusOnObject(targetObject: any) {
  if (this.editor) {
    await this.editor.centerObjectInViewport(targetObject);
  }
}
```

## Listening to Events

Bind to Angular events on the custom element `<kritzel-editor>` to stay updated on canvas changes. 

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
  console.log("Canvas objects updated:", objects.length);
}

onViewportChange(event: Event) {
  const viewport = (event as CustomEvent<KritzelViewportState>).detail;
  console.log("Viewport updated:", viewport);
}
```

## Interactive Basic Usage Example

Below is a complete example combining everything covered in this guide. It provides a simple custom toolbar to trigger tools, insert programmatic text, zoom into the canvas, and displays a dynamic counter of the total objects.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  repoFiles={['src/app/basic-usage/basic-usage.component.ts']}
  demoPath="/basic-usage"
/>
