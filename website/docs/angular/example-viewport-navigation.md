---
sidebar_label: Viewport Navigation
displayed_sidebar: tutorialSidebar
title: "Viewport Navigation Example | Kritzel for Angular"
description: "Build a complete navigation layer step by step, from a zoom reset button through focusing on a selected object to a presentation mode with bounded scrolling."
---

# Viewport Control & Navigation

This guide builds up viewport control step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How the Viewport Works

The viewport is described by `KritzelViewportState`:

```ts
interface KritzelViewportState {
  translateX: number; // current pan offset in world units (X axis)
  translateY: number; // current pan offset in world units (Y axis)
  scale: number;      // current zoom level (1 = 100 %)
  width: number;      // viewport width in pixels
  height: number;     // viewport height in pixels
}
```

All navigation methods — `panTo`, `zoomTo`, `setViewport`, `centerObjectInViewport` — work in **world coordinates**. The helpers `screenToWorld` and `worldToScreen` convert between the two coordinate spaces whenever your UI needs to bridge them. The `viewportChange` event fires after every pan or zoom, carrying the updated `KritzelViewportState`.

---

## Step 1: Zoom Reset Button

Wait for `isReady`, then call `zoomTo(1)` to snap back to 100 % zoom centred on the current pan position:

```ts title="editor.component.ts"
import { Component, ViewChild } from '@angular/core'; // highlight-line
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // highlight-start
  template: `
    <kritzel-editor></kritzel-editor>
    <button (click)="resetZoom()">Reset Zoom</button>
  `,
  // highlight-end
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor; // highlight-line

  // highlight-start
  async resetZoom() {
    await this.editor.zoomTo(1);
  }
  // highlight-end
}
```

`zoomTo(scale)` changes the zoom level without moving the pan position. Omitting the optional `worldX`/`worldY` arguments zooms around the viewport centre.

---

## Step 2: Displaying the Current Viewport State

Subscribe to `viewportChange` to keep a reactive signal up to date with the live viewport:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core'; // highlight-line
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelViewportState } from 'kritzel-stencil'; // highlight-line

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <button (click)="resetZoom()">Reset Zoom</button>
    // highlight-start
    <div>
      Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }} %
      &nbsp;|&nbsp;
      X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
      Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
    </div>
    // highlight-end
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  viewport = signal<KritzelViewportState | null>(null); // highlight-line

  async resetZoom() {
    await this.editor.zoomTo(1);
  }

  // highlight-start
  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
  // highlight-end
}
```

The `viewportChange` event fires after every pan or zoom interaction as well as after any programmatic call. The signal always reflects the latest state without polling.

---

## Step 3: Pan to Origin

Add a second button that calls `panTo` to move the canvas so that world coordinate `(0, 0)` is centred in the viewport:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelViewportState } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <button (click)="resetZoom()">Reset Zoom</button>
    <button (click)="panToOrigin()">Go to Origin</button>
    // highlight-line
    <div>
      Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }} %
      &nbsp;|&nbsp;
      X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
      Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
    </div>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  viewport = signal<KritzelViewportState | null>(null);

  async resetZoom() {
    await this.editor.zoomTo(1);
  }

  // highlight-start
  async panToOrigin() {
    await this.editor.panTo(0, 0);
  }
  // highlight-end

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
```

`panTo(x, y)` centres the viewport on the given world coordinates without altering the current zoom level. It is the equivalent of `setViewport(x, y, currentScale)`.

---

## Step 4: Set Viewport Position and Scale Together

Replace both buttons with a single "Reset View" action that uses `setViewport` to restore a specific position and zoom level in one call:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelViewportState } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <button (click)="resetView()">Reset View</button>
    // highlight-line
    <div>
      Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }} %
      &nbsp;|&nbsp;
      X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
      Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
    </div>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  viewport = signal<KritzelViewportState | null>(null);

  // highlight-start
  async resetView() {
    await this.editor.setViewport(0, 0, 1);
  }
  // highlight-end

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
```

`setViewport(x, y, scale)` is the atomic version of calling `panTo` followed by `zoomTo`. Use it whenever you need to restore a saved viewport snapshot or jump to a bookmark.

---

## Step 5: Focus on a Selected Object

Add a "Focus Selected" button that reads the current selection and centres the viewport on the first selected object using `centerObjectInViewport`:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelViewportState } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <button (click)="resetView()">Reset View</button>
    <button (click)="focusSelected()">Focus Selected</button>
    // highlight-line
    <div>
      Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }} %
      &nbsp;|&nbsp;
      X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
      Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
    </div>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  viewport = signal<KritzelViewportState | null>(null);

  async resetView() {
    await this.editor.setViewport(0, 0, 1);
  }

  // highlight-start
  async focusSelected() {
    const selected = await this.editor.getSelectedObjects();
    if (selected.length > 0) {
      await this.editor.centerObjectInViewport(selected[0]);
    }
  }
  // highlight-end

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
```

`centerObjectInViewport` pans and zooms so that the object fills an appropriate portion of the viewport. It does not require you to know the object's position — the engine calculates the target viewport from the object's bounding box.

---

## Step 6: Converting Between Screen and World Coordinates

Use `screenToWorld` to translate a click position on the canvas element into a world coordinate, then pass that point as the anchor to `zoomTo`:

```ts title="editor.component.ts"
import { Component, ElementRef, signal, ViewChild } from '@angular/core'; // highlight-line
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelViewportState } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editorEl
      (viewportChange)="onViewportChange($event)"
      (click)="onCanvasClick($event)"
    ></kritzel-editor>
    // highlight-start
    <button (click)="resetView()">Reset View</button>
    <button (click)="focusSelected()">Focus Selected</button>
    // highlight-end
    <div>
      Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }} %
      &nbsp;|&nbsp;
      X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
      Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
    </div>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>; // highlight-line

  viewport = signal<KritzelViewportState | null>(null);

  async resetView() {
    await this.editor.setViewport(0, 0, 1);
  }

  async focusSelected() {
    const selected = await this.editor.getSelectedObjects();
    if (selected.length > 0) {
      await this.editor.centerObjectInViewport(selected[0]);
    }
  }

  // highlight-start
  async onCanvasClick(event: MouseEvent) {
    const rect = this.editorEl.nativeElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const world = await this.editor.screenToWorld(screenX, screenY);
    await this.editor.zoomTo(2, world.x, world.y);
  }
  // highlight-end

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
```

`screenToWorld` expects coordinates **relative to the editor element**, not the browser window. Subtract the element's bounding rect before passing the values. The returned world point is then passed to `zoomTo` as the zoom anchor, so the clicked spot stays fixed as the canvas scales in.

---

## Step 7: Bounded Scrolling with Viewport Boundaries

Add inputs to the `<kritzel-editor>` element to restrict how far the user can pan, enabling a presentation or kiosk mode with a defined canvas area:

```ts title="editor.component.ts"
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelViewportState } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editorEl
      // highlight-start
      [viewportBoundaryLeft]="-2000"
      [viewportBoundaryRight]="2000"
      [viewportBoundaryTop]="-2000"
      [viewportBoundaryBottom]="2000"
      // highlight-end
      (viewportChange)="onViewportChange($event)"
      (click)="onCanvasClick($event)"
    ></kritzel-editor>
    <button (click)="resetView()">Reset View</button>
    <button (click)="focusSelected()">Focus Selected</button>
    <div>
      Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }} %
      &nbsp;|&nbsp;
      X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
      Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
    </div>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  viewport = signal<KritzelViewportState | null>(null);

  async resetView() {
    await this.editor.setViewport(0, 0, 1);
  }

  async focusSelected() {
    const selected = await this.editor.getSelectedObjects();
    if (selected.length > 0) {
      await this.editor.centerObjectInViewport(selected[0]);
    }
  }

  async onCanvasClick(event: MouseEvent) {
    const rect = this.editorEl.nativeElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const world = await this.editor.screenToWorld(screenX, screenY);
    await this.editor.zoomTo(2, world.x, world.y);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
```

The four boundary inputs (`viewportBoundaryLeft`, `viewportBoundaryRight`, `viewportBoundaryTop`, `viewportBoundaryBottom`) define a rectangle in world coordinates that the viewport centre cannot leave. By default all four are `Infinity`, meaning no restriction. Setting finite values prevents the user from panning outside the defined area while still allowing free zooming.
