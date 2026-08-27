---

sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
title: "Basic Usage | Kritzel for Angular"
description: "Programmatically interact with the Kritzel editor instance in your Angular app: load objects, change tools, and respond to events."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Basic Usage

Once you have `<kritzel-editor>` rendering in your application, you can start interacting with the canvas programmatically. Internally, the editor manages the view, drawing state, and objects. It reports changes through DOM events, and lets you make programmatic changes via asynchronous method calls.

## Wait for the Editor's isReady Event

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

The default toolbar includes these built-in tools: `selection`, `brush`, `eraser`, `line`, `shape`, `text`, and `image`. To switch tools in code, call `changeActiveTool` with the tool's registered name. Changes made through the editor API happen asynchronously.

```ts
async setBrushTool() {
  await this.editor.changeActiveTool('brush');
}

async setSelectionTool() {
  await this.editor.changeActiveTool('selection');
}
```

## Working with the Object Model

All elements on the canvas are represented as objects. You can listen to `objectsChange` to track changes, and use the core object methods to work with them: `addObject` to add an object, `updateObject` to change one, and `deleteObject` to remove one. For instance, adding a text element programmatically looks as follows:

```ts
import { KritzelText } from "kritzel-angular";

async addText() {
  const text = new KritzelText({
    text: "Programmatic text!",
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: "Arial",
    fontColor: { light: "#ff0000", dark: "#ff6666" }
  });

  await this.editor.addObject(text);
}
```

## Interacting with the Viewport

The editor allows you to programmatically control the viewport (camera) to zoom, pan, or center on specific coordinates or objects.

```ts
async zoomIn() {
  await this.editor.zoomTo(1.5);
}

async focusOnObject(targetObject: any) {
  await this.editor.centerObjectInViewport(targetObject);
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
  repoFiles={['src/app/getting-started/basic-usage.component.ts']}
  demoPath="/getting-started/basic-usage"
/>
