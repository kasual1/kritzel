---
sidebar_label: Workspace Management
displayed_sidebar: tutorialSidebar
title: "Workspace Management Example | Kritzel for Angular"
description: "Build a full CRUD workspace tab bar step by step, from reading the initial list through creating, switching, renaming, and deleting workspaces."
---

# Workspace Management

This guide builds up workspace management step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled multi-workspace tab bar.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Workspaces Work

A workspace is described by the `KritzelWorkspace` class:

```ts
class KritzelWorkspace {
  id: string;        // unique identifier
  name: string;      // display name shown in the UI
  createdAt: Date;
  updatedAt: Date;
  viewport: {
    centerWorldX: number;  // saved pan position (X)
    centerWorldY: number;  // saved pan position (Y)
    scale: number;         // saved zoom level
  };
  isPublic: boolean; // whether the workspace is accessible via a share link
}
```

The editor always has one active workspace. The `activeWorkspaceId` input prop drives which workspace is loaded; changing it switches the canvas. The `activeWorkspaceChange` event fires whenever the active workspace changes, carrying the new workspace's metadata.

The four CRUD methods — `createWorkspace`, `getWorkspaces`, `updateWorkspace`, `deleteWorkspace` — operate on the persisted list. Because the `<kritzel-editor>` element does not re-emit a `workspacesChange` event, call `getWorkspaces()` to refresh the list after any mutation.

---

## Step 1: Reading the Initial Workspace List

Wait for `isReady`, then call `getWorkspaces()` to seed a `workspaces` signal with the list that was already persisted:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core'; // highlight-start
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { EditorIsReadyEvent, KritzelWorkspace } from 'kritzel-stencil'; // highlight-end

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      // highlight-start
      (isReady)="onReady($event)"
      // highlight-end
    ></kritzel-editor>
    // highlight-start
    <ul>
      @for (ws of workspaces(); track ws.id) {
        <li>{{ ws.name }}</li>
      }
    </ul>
    // highlight-end
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor; // highlight-start

  workspaces = signal<KritzelWorkspace[]>([]);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
  }
  // highlight-end
}
```

`isReady` fires once the engine has fully initialised and all persisted workspaces have been loaded. Reading `getWorkspaces()` inside this handler guarantees the list is complete before the first render.

---

## Step 2: Tracking the Active Workspace

Bind `activeWorkspaceId` and listen to `activeWorkspaceChange` so the component always knows which workspace is currently open:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace } from 'kritzel-stencil'; // highlight-start
// highlight-end

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      // highlight-start
      [activeWorkspaceId]="activeWorkspaceId()"
      // highlight-end
      (isReady)="onReady($event)"
      // highlight-start
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
      // highlight-end
    ></kritzel-editor>
    <ul>
      @for (ws of workspaces(); track ws.id) {
        // highlight-start
        <li [class.active]="ws.id === activeWorkspaceId()">{{ ws.name }}</li>
        // highlight-end
      }
    </ul>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  workspaces = signal<KritzelWorkspace[]>([]);
  // highlight-start
  activeWorkspaceId = signal<string | undefined>(undefined);
  // highlight-end

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    // highlight-start
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
    // highlight-end
  }

  // highlight-start
  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }
  // highlight-end
}
```

`activeWorkspaceChange` fires after any workspace switch — whether triggered by the user interacting with the built-in workspace manager or by the component setting `activeWorkspaceId`. Reading the initial active workspace ID from `event.detail.activeWorkspace` inside `isReady` seeds the signal before any switch occurs.

---

## Step 3: Switching Between Workspaces

Add click handlers to the list items so that clicking a workspace name switches to it:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [activeWorkspaceId]="activeWorkspaceId()"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
    <ul>
      @for (ws of workspaces(); track ws.id) {
        <li
          [class.active]="ws.id === activeWorkspaceId()"
          // highlight-start
          (click)="switchTo(ws)"
          // highlight-end
        >{{ ws.name }}</li>
      }
    </ul>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  // highlight-start
  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }
  // highlight-end
}
```

Setting `activeWorkspaceId` to a new value causes the `[activeWorkspaceId]` binding to propagate the change to the editor, which then loads the matching workspace and fires `activeWorkspaceChange` to confirm the switch.

---

## Step 4: Creating a Workspace

Add a "New Board" button that calls `createWorkspace` with a fresh `KritzelWorkspace` instance, then refreshes the list:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [activeWorkspaceId]="activeWorkspaceId()"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
    <ul>
      @for (ws of workspaces(); track ws.id) {
        <li
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >{{ ws.name }}</li>
      }
    </ul>
    // highlight-start
    <button (click)="addWorkspace()">New Board</button>
    // highlight-end
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }

  // highlight-start
  async addWorkspace() {
    const workspace = new KritzelWorkspace(crypto.randomUUID(), 'New Board');
    await this.editor.createWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
    this.switchTo(workspace);
  }
  // highlight-end
}
```

`createWorkspace` persists the new workspace and returns it. Calling `getWorkspaces()` afterwards synchronises the local signal with the updated list. Passing the new workspace to `switchTo` immediately navigates to it, so the empty canvas opens right away.

---

## Step 5: Renaming a Workspace

Add an inline rename interaction that updates the `name` property of the workspace object and persists the change via `updateWorkspace`:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [activeWorkspaceId]="activeWorkspaceId()"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
    <ul>
      @for (ws of workspaces(); track ws.id) {
        <li
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >
          {{ ws.name }}
          // highlight-start
          <button (click)="rename(ws, $event)">Rename</button>
          // highlight-end
        </li>
      }
    </ul>
    <button (click)="addWorkspace()">New Board</button>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }

  async addWorkspace() {
    const workspace = new KritzelWorkspace(crypto.randomUUID(), 'New Board');
    await this.editor.createWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
    this.switchTo(workspace);
  }

  // highlight-start
  async rename(workspace: KritzelWorkspace, event: MouseEvent) {
    event.stopPropagation();
    const newName = prompt('Workspace name:', workspace.name);
    if (!newName || newName === workspace.name) return;
    workspace.name = newName;
    await this.editor.updateWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
  }
  // highlight-end
}
```

`updateWorkspace` persists any property changes made to the workspace object — in this case the `name`. Refreshing the list via `getWorkspaces()` causes Angular to re-render the tab labels with the updated name.

---

## Step 6: Deleting a Workspace

Add a delete button that removes the workspace and, if it was active, switches to the next available workspace:

```ts title="editor.component.ts"
import { Component, signal, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [activeWorkspaceId]="activeWorkspaceId()"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
    <ul>
      @for (ws of workspaces(); track ws.id) {
        <li
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >
          {{ ws.name }}
          <button (click)="rename(ws, $event)">Rename</button>
          // highlight-start
          <button
            [disabled]="workspaces().length <= 1"
            (click)="remove(ws, $event)"
          >Delete</button>
          // highlight-end
        </li>
      }
    </ul>
    <button (click)="addWorkspace()">New Board</button>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }

  async addWorkspace() {
    const workspace = new KritzelWorkspace(crypto.randomUUID(), 'New Board');
    await this.editor.createWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
    this.switchTo(workspace);
  }

  async rename(workspace: KritzelWorkspace, event: MouseEvent) {
    event.stopPropagation();
    const newName = prompt('Workspace name:', workspace.name);
    if (!newName || newName === workspace.name) return;
    workspace.name = newName;
    await this.editor.updateWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
  }

  // highlight-start
  async remove(workspace: KritzelWorkspace, event: MouseEvent) {
    event.stopPropagation();
    const wasActive = workspace.id === this.activeWorkspaceId();
    await this.editor.deleteWorkspace(workspace);
    const remaining = await this.editor.getWorkspaces();
    this.workspaces.set(remaining);
    if (wasActive && remaining.length > 0) {
      this.switchTo(remaining[0]);
    }
  }
  // highlight-end
}
```

`deleteWorkspace` removes the workspace from persistent storage but does not automatically switch the active workspace. The component checks whether the deleted workspace was active and, if so, redirects to the first remaining workspace. The delete button is disabled when only one workspace remains, preventing an empty-state scenario.
