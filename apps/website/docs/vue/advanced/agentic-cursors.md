---
sidebar_label: Agentic Cursors
displayed_sidebar: tutorialSidebar
title: "Agentic Cursors | Kritzel for Vue"
description: "Add cursors you control from code, move them smoothly across the canvas, and stick them to objects - for example to visualize an AI agent working on the board."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Agentic Cursors

## Overview

Agentic cursors are cursors that you control from code instead of a pointer device. Use them to make automated work visible on the canvas, for example an AI agent that reviews, arranges, or annotates objects.

Each agentic cursor has its own color, an optional name label, and an optional status message. You can place a cursor anywhere on the canvas, animate it smoothly to a new position, or stick it to an object so it follows that object while it is moved, resized, or rotated. When a cursor leaves the visible area, an indicator at the edge of the viewport points to it.

Agentic cursors are rendered locally only. They are not synchronized to collaborators, so every client decides which cursors it shows.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/agentic-cursors/basic"
  repoFiles={['src/pages/advanced/agentic-cursors/AgenticCursorsBasicPage.vue']}
/>

## Adding a Cursor

Get a reference to the editor with `getEditorRef` and add cursors once the editor emits `isReady`:

```html
<script setup lang="ts">
import { getEditorRef, KritzelEditor } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')

async function onReady() {
  await editor.value?.addAgenticCursor({
    id: 'planner',
    name: 'Planner',
    color: '#7C3AED',
    status: 'Thinking…',
    position: { x: 0, y: 0 },
  })
}
</script>

<template>
  <KritzelEditor ref="editor" @isReady="onReady" />
</template>
```

`addAgenticCursor()` accepts the following options and returns a snapshot of the created cursor:

| Option | Type | Description |
|--------|------|-------------|
| id | string | Unique ID. Generated when omitted. |
| name | string | Name shown in the cursor label. |
| color | string | Any CSS color. Derived from the name when omitted. |
| status | string | Optional status message shown below the label. |
| visible | boolean | Whether the cursor is visible. Defaults to `true`. |
| position | KritzelAgenticCursorTarget | Initial position. Defaults to the center of the viewport. An object target attaches the cursor right away. |

## Moving a Cursor

Call `moveAgenticCursor()` with either world coordinates or an object. The cursor animates to its target, and the returned promise resolves when it arrives, so you can `await` each step of an agent run:

```ts
const editor = editor.value;

// Move to a point in world coordinates
await editor?.moveAgenticCursor('planner', { x: 200, y: 120 });

// Move to the top-right corner of an object
await editor?.moveAgenticCursor('planner', { objectId: shape.id, anchor: 'top-right' });

// Override the timing of a single move
await editor?.moveAgenticCursor('planner', { x: 0, y: 0 }, { duration: 800, easing: 'ease-out' });
```

By default the duration depends on the distance, so short moves are quick and long moves never take more than about a second. Use the move options to change this:

| Option | Type | Description |
|--------|------|-------------|
| duration | number | Fixed duration in milliseconds. Overrides the distance-based duration. |
| easing | KritzelEasing | `'linear'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'` (default), or a custom `(t: number) => number` function. |
| speed | number | Speed in screen pixels per second for the distance-based duration. Defaults to `1200`. |
| attach | boolean | Whether the cursor sticks to an object target after arriving. Defaults to `true`. |

Object targets accept an `anchor` (`'center'`, `'top-left'`, `'top'`, `'top-right'`, `'right'`, `'bottom-right'`, `'bottom'`, `'bottom-left'`, or `'left'`) and an optional `offset` in world units. Anchors rotate with the object.

If you start a new move while a cursor is still moving, the cursor continues from its current position and the previous promise resolves with `{ completed: false }`. Moving to an object that does not exist rejects the promise.

## Attaching to Objects

When a cursor moves to an object, it sticks to that object once it arrives. It then stays on the chosen anchor while the object is dragged, resized, or rotated. Moving the cursor somewhere else releases it, and `detachAgenticCursor()` releases it in place:

```ts
await editor.value?.detachAgenticCursor('planner');
```

If an object with an attached cursor is deleted, the cursor stays where the object was and the editor emits `agenticCursorDetached` with `reason: 'object-removed'`. A manual detach emits the same event with `reason: 'manual'`:

```html
<script setup lang="ts">
import type { KritzelAgenticCursorDetachedEvent } from '@kritzel/vue-editor'

function onDetached(event: CustomEvent<KritzelAgenticCursorDetachedEvent>) {
  console.log(event.detail.id, event.detail.objectId, event.detail.reason)
}
</script>

<template>
  <KritzelEditor ref="editor" @agenticCursorDetached="onDetached" />
</template>
```

## Status Messages

Use `updateAgenticCursor()` to show what an agent is doing. The same method changes the name, color, or visibility of a cursor. Pass `null` as the status to hide the status message:

```ts
const editor = editor.value;

await editor?.updateAgenticCursor('planner', { status: 'Reviewing shapes' });
await editor?.updateAgenticCursor('planner', { status: null, color: '#16A34A' });
```

Call `removeAgenticCursor()` to remove a single cursor, or `clearAgenticCursors()` to remove all of them. `getAgenticCursor()` and `getAgenticCursors()` return snapshots that include the current position, the attached object, and whether the cursor is moving.

## Performing Actions

A cursor can also work on the canvas itself. `performAgenticAction()` lets it fly to the target, press, and animate the change, for example dragging an object or drawing a stroke. The changes are saved and synced like the user's edits, but they are recorded in the cursor's own history, so the user's undo never reverts them. The cursor and the objects it selects stay local.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/agentic-cursors/actions"
  repoFiles={['src/pages/advanced/agentic-cursors/AgenticCursorsActionsPage.vue']}
/>

```ts
const current = editor.value;

const result = await current?.performAgenticAction('planner', {
  type: 'moveObject',
  objectId: shape.id,
  to: { x: 400, y: 120 },
});

if (!result?.completed) {
  console.log('Stopped:', result?.reason);
}
```

The second argument describes the action. Coordinates and sizes are in world units:

| Action | Description |
|--------|-------------|
| `{ type: 'click', target }` | Presses at a point or an object anchor. Nothing changes; `objectIds` contains the object under the cursor. |
| `{ type: 'select', objectIds, additive? }` | Selects objects for the cursor. Agent selections are outlined in the cursor color and never change the user's selection. |
| `{ type: 'clearSelection' }` | Clears the cursor's selection. |
| `{ type: 'moveObject', objectId, to, align? }` | Drags an object so that its `align` point (default `'center'`) lands on `to`, a point or an object anchor. |
| `{ type: 'resizeObject', objectId, width?, height?, keepAspectRatio?, handle? }` | Drags a corner handle until the object has the new size. The opposite corner stays in place. |
| `{ type: 'rotateObject', objectId, angle, relative? }` | Turns the object with the rotation handle. `angle` is in degrees, clockwise. |
| `{ type: 'createShape', x, y, width, height, shapeType?, text?, style? }` | Drags out a new shape and optionally types text into it. |
| `{ type: 'createText', x, y, text, style? }` | Creates a text object and types into it. |
| `{ type: 'typeText', objectId, text, mode? }` | Types into a text or shape. `mode: 'replace'` clears it first. |
| `{ type: 'drawPath', points, style? }` | Draws a freehand stroke through the points. |
| `{ type: 'connect', from, to, style? }` | Draws a line between two objects and anchors both ends, so the line follows them. |
| `{ type: 'deleteObjects', objectIds }` | Deletes objects. |
| `{ type: 'undo' }`, `{ type: 'redo' }` | Undoes or redoes the cursor's last action. |

Objects that an action creates use the current settings of the matching tool unless you pass a `style`. Actions of one cursor run one after another, in the order you call them, while different cursors work at the same time. Use the third argument to change the pace:

| Option | Type | Description |
|--------|------|-------------|
| speed | number | Speed in screen pixels per second. Defaults to `1200`. Also scales presses, drags, drawing, and typing. |
| instant | boolean | Skips all animation and applies the change at once. Defaults to `false`. |
| signal | AbortSignal | Stops the action, also while it waits for earlier actions of the cursor. Its changes are rolled back. |
| easing | KritzelEasing | Easing of the cursor flight and of drags. Defaults to `'ease-in-out'`. |

### Results and Conflicts

The returned promise resolves when the action ends. `completed` is `false` when the action was refused or stopped, and `reason` says why. An unknown cursor or an invalid action rejects the promise instead.

Agents never take an object away from a person:

- An object that the user has selected is refused with `'user-selected'`. If the user selects or grabs an object while an agent is working on it, the agent stops with `'user-selected'` or `'user-interaction'` and keeps what it has done so far as one step of its history.
- An object that a collaborator has selected is refused with `'collaborator-editing'`.
- An object that another cursor is working on or has selected is refused with `'claimed-by-agent'`.

The other reasons are `'aborted'`, `'interrupted'` (`moveAgenticCursor()` was called for the cursor), `'cursor-removed'`, `'object-removed'`, `'workspace-changed'`, `'not-allowed'` (the object configuration forbids resizing or rotating), `'invalid-target'`, `'conflict'`, `'nothing-to-undo'`, `'nothing-to-redo'`, and `'engine-disconnected'`. Apart from a takeover by the user, a stopped action is rolled back:

```ts
const controller = new AbortController();
const run = current?.performAgenticAction('planner', { type: 'drawPath', points }, { signal: controller.signal });

controller.abort(); // the stroke is removed again
```

### Agent History

Each cursor has its own undo history. `{ type: 'undo' }` reverts the cursor's last action and `{ type: 'redo' }` applies it again; the user's undo and redo never touch agent changes. `getAgenticCursor()` reports `canUndo` and `canRedo`, as well as `activeAction`, `queueLength`, and `selectedObjectIds`:

```ts
const cursor = await current?.getAgenticCursor('planner');

if (cursor?.canUndo) {
  await current?.performAgenticAction('planner', { type: 'undo' });
}
```

### Telling Agent Changes Apart

`objectsAdded`, `objectsUpdated`, and `objectsRemoved` carry a `source` when an agentic cursor made the change. It names the cursor and the action:

```html
<script setup lang="ts">
import type { ObjectsUpdatedEvent } from '@kritzel/vue-editor'

function onObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
  const source = event.detail.source
  if (source) {
    console.log(`${source.cursorId} ran ${source.actionType}`)
  }
}
</script>

<template>
  <KritzelEditor ref="editor" @objectsUpdated="onObjectsUpdated" />
</template>
```

## API Details

For the full list of related APIs, see the following reference sections.

- [Agentic Cursors](../api-reference/editor.md#agentic-cursors)
- [Agentic Cursor Types](../api-reference/types.md#agentic-cursor-types)
