---
sidebar_label: Object Management
displayed_sidebar: tutorialSidebar
title: "Object Management Example | Kritzel for Angular"
description: "Build a programmatic object layer panel step by step, from a read-only snapshot up to real-time updates, selection control, and property mutation."
---

# Programmatic Object Management

This guide builds up programmatic object management step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Object Management Works

Every canvas object extends `KritzelBaseObject`, which exposes common properties such as `id`, `__class__`, `opacity`, `zIndex`, `isVisible`, `translateX`, `translateY`, `width`, and `height`. Subclasses like `KritzelShape`, `KritzelText`, and `KritzelPath` add type-specific properties on top.

The editor exposes three read methods — `getAllObjects()`, `findObjects(predicate)`, and `getObjectById(id)` — and three write methods — `addObject(object)`, `updateObject(object, partialProps)`, and `removeObject(object)`. The write methods each emit a corresponding output event (`objectsAdded`, `objectsUpdated`, `objectsRemoved`) carrying the affected objects. These same events fire when the user draws or erases objects interactively, so a single set of handlers covers all change sources. `selectObjects(objects)` switches to the selection tool and programmatically highlights the given objects.

---

## Step 1: Reading All Objects on Ready

Wait for the `isReady` event, then call `getAllObjects()` to load the initial snapshot into a signal:

```ts title="editor.component.ts"

import { Component, signal, ViewChild } from '@angular/core'; // highlight-line
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { EditorIsReadyEvent, KritzelBaseObject } from 'kritzel-stencil'; // highlight-line

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // highlight-start
  template: `
    <kritzel-editor
      (isReady)="onIsReady($event)"
    ></kritzel-editor>
    <ul>
      @for (obj of objects(); track obj.id) {
        <li>{{ obj.__class__ }} — {{ obj.id }}</li>
      }
    </ul>
  `,
  // highlight-end
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor; // highlight-line

  objects = signal<KritzelBaseObject[]>([]); // highlight-line

  // highlight-start
  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const all = await this.editor.getAllObjects();
    this.objects.set(all);
  }
  // highlight-end
}
```

`getAllObjects()` returns a live array reference from the canvas store. The signal holds a snapshot of that array at the moment of the call; it will not update automatically as objects are added or removed.

---

## Step 2: Keeping the List Current with Events

Add the three change outputs to the template and update the signal in each handler:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { EditorIsReadyEvent, KritzelBaseObject, ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent } from 'kritzel-stencil'; // highlight-line

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <ul>
      @for (obj of objects(); track obj.id) {
        <li>{{ obj.__class__ }} — {{ obj.id }}</li>
      }
    </ul>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  objects = signal<KritzelBaseObject[]>([]);

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const all = await this.editor.getAllObjects();
    this.objects.set(all);
  }

  // highlight-start
  onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    this.objects.update(prev => [...prev, ...event.detail.objects]);
  }

  onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    const removedIds = new Set(event.detail.objects.map(o => o.id));
    this.objects.update(prev => prev.filter(o => !removedIds.has(o.id)));
  }

  onObjectsUpdated(_event: CustomEvent<ObjectsUpdatedEvent>) {
    // getAllObjects() returns the same live references, so re-spreading
    // the array is sufficient to trigger Angular's change detection.
    this.objects.update(prev => [...prev]);
  }
  // highlight-end
}
```

Each output fires for both user-driven and programmatic changes, so these three handlers are the only place that needs to keep the list in sync. `onObjectsUpdated` re-spreads the existing array because the object references themselves are mutated in place by `updateObject()`.

---

## Step 3: Selecting an Object Programmatically

Add a click handler to each list item that calls `selectObjects()`:

```ts title="editor.component.ts"
// ...
  template: `
    <kritzel-editor
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <ul>
      @for (obj of objects(); track obj.id) {
        <li (click)="selectObject(obj)">{{ obj.__class__ }} — {{ obj.id }}</li>
      }
    </ul>
  `,
// ...

  // highlight-start
  async selectObject(obj: KritzelBaseObject) {
    await this.editor.selectObjects([obj]);
  }
  // highlight-end
```

`selectObjects()` switches the active tool to the selection tool and highlights the given objects on the canvas, exactly as if the user had clicked them. Passing an empty array clears the selection.

---

## Step 4: Mutating an Object

Add a button next to each row that halves the object's opacity using `updateObject()`:

```ts title="editor.component.ts"
// ...
  template: `
    <kritzel-editor
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <ul>
      @for (obj of objects(); track obj.id) {
        <li>
          <span (click)="selectObject(obj)">{{ obj.__class__ }} — {{ obj.id }}</span>
          <button (click)="halveOpacity(obj)">½ opacity</button>
        </li>
      }
    </ul>
  `,
// ...

  // highlight-start
  async halveOpacity(obj: KritzelBaseObject) {
    await this.editor.updateObject(obj, { opacity: obj.opacity * 0.5 });
  }
  // highlight-end
```

`updateObject()` merges the partial properties into the existing object, rerenders the canvas, and emits `objectsUpdated` — which the handler from Step 2 picks up automatically, refreshing the list without any extra wiring.

---

## Step 5: Removing an Object Programmatically

Extend the row with a delete button that calls `removeObject()`:

```ts title="editor.component.ts"
// ...
  template: `
    <kritzel-editor
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <ul>
      @for (obj of objects(); track obj.id) {
        <li>
          <span (click)="selectObject(obj)">{{ obj.__class__ }} — {{ obj.id }}</span>
          <button (click)="halveOpacity(obj)">½ opacity</button>
          <button (click)="deleteObject(obj)">Delete</button>
        </li>
      }
    </ul>
  `,
// ...

  // highlight-start
  async deleteObject(obj: KritzelBaseObject) {
    await this.editor.removeObject(obj);
  }
  // highlight-end
```

`removeObject()` deselects all objects, removes the target from the canvas store, rerenders, and emits `objectsRemoved`. The `onObjectsRemoved` handler from Step 2 filters it out of the signal automatically.

---

## Step 6: Filtering the List

Replace `getAllObjects()` in `onIsReady` with `findObjects()` to load only a specific type:

```ts title="editor.component.ts"
  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    // highlight-start
    const shapes = await this.editor.findObjects(
      obj => obj.__class__ === 'KritzelShape'
    );
    this.objects.set(shapes);
    // highlight-end
  }
```

`findObjects()` accepts any predicate over `KritzelBaseObject`, so the same pattern works for filtering by `opacity`, `zIndex`, spatial position, or any other property. The event-driven updates from Step 2 continue to work — extend the `onObjectsAdded` handler with the same predicate to keep the filtered list consistent:

```ts title="editor.component.ts"
  onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    // highlight-start
    const newShapes = event.detail.objects.filter(
      o => o.__class__ === 'KritzelShape'
    );
    this.objects.update(prev => [...prev, ...newShapes]);
    // highlight-end
  }
```
