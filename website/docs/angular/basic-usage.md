---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
---

# Basic Usage

Once you have `<kritzel-editor>` rendering in your application, you can start interacting with the canvas programmatically.

## Accessing the Editor Instance

Use `@ViewChild` to grab a reference to the editor instance to call API methods. Note that most API methods are asynchronous and return Promises.

```ts
import { Component, ViewChild, ElementRef } from '@angular/core';

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
    const detail = (event as CustomEvent<HTMLKritzelEditorElement>).detail;
    console.log('Editor is ready!');
  }
}
```

## Changing Tools

You can programmatically change the active drawing tool currently used by the canvas.

```ts
async setBrushTool() {
  if (this.editor) {
    await this.editor.setActiveTool('brush');
  }
}

async setSelectTool() {
  if (this.editor) {
    await this.editor.setActiveTool('select');
  }
}
```

## Listening to Events

Bind to angular events on the custom element `<kritzel-editor>` to stay updated on canvas changes.

```html
<kritzel-editor 
  (objectsChange)="onObjectsChange($event)"
  (viewportChange)="onViewportChange($event)">
</kritzel-editor>
```

```ts
onObjectsChange(event: Event) {
  const detail = (event as CustomEvent).detail;
  console.log("Canvas objects have changed:", detail);
}

onViewportChange(event: Event) {
  const detail = (event as CustomEvent).detail;
  console.log("Viewport updated:", detail);
}
```

## Calling Methods

You can access the component methods using the `@ViewChild` reference (`this.editor`).

```ts
async zoomIn() {
  if (this.editor) {
    await this.editor.zoomTo(1.5);
  }
}
  
async undoAction() {
  if (this.editor) {
    await this.editor.undo();
  }
}
```

## Adding and Modifying Objects

You can add objects to the canvas programmatically using the provided classes such as `KritzelText`, `KritzelPath`, or `KritzelShape`.

```ts
import { KritzelText } from "kritzel-angular";

async addText() {
  if (this.editor) {
    const text = new KritzelText({
      value: "Programmatic text!",
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#ff0000"
    });

    await this.editor.addObject(text);
    await this.editor.centerObjectInViewport(text);
    await this.editor.selectObjects([text]); // Automatically select it
  }
}
```
