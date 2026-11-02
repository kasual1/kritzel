---
sidebar_label: Agentic Cursors
displayed_sidebar: tutorialSidebar
title: "Agentic Cursors | Kritzel for Angular"
description: "Add cursors you control from code, move them smoothly across the canvas, and stick them to objects - for example to visualize an AI agent working on the board."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Agentic Cursors

## Overview

Agentic cursors are cursors that you control from code instead of a pointer device. Use them to make automated work visible on the canvas, for example an AI agent that reviews, arranges, or annotates objects.

Each agentic cursor has its own color, an optional name label, and an optional status message. You can place a cursor anywhere on the canvas, animate it smoothly to a new position, or stick it to an object so it follows that object while it is moved, resized, or rotated. Cursors can also point at an element inside the page of an iframe object, such as a button. When a cursor leaves the visible area, an indicator at the edge of the viewport points to it.

Agentic cursors are rendered locally only. They are not synchronized to collaborators, so every client decides which cursors it shows.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/agentic-cursors/basic"
  repoFiles={['src/app/pages/advanced/agentic-cursors/agentic-cursors-basic.component.ts']}
/>

## Adding a Cursor

Get a reference to the editor with `viewChild(KritzelEditor)` and add cursors once the editor emits `isReady`:

```ts
import { Component, viewChild } from '@angular/core';
import { KritzelEditor } from '@kritzel/angular-editor';

@Component({
  selector: 'app-agent-board',
  imports: [KritzelEditor],
  template: `<kritzel-editor (isReady)="onReady()"></kritzel-editor>`,
})
export class AgentBoardComponent {
  editor = viewChild(KritzelEditor);

  async onReady() {
    await this.editor()?.addAgenticCursor({
      id: 'planner',
      name: 'Planner',
      color: '#7C3AED',
      status: 'Thinking…',
      position: { x: 0, y: 0 },
    });
  }
}
```

`addAgenticCursor()` accepts the following options and returns a snapshot of the created cursor:

| Option | Type | Description |
|--------|------|-------------|
| id | string | Unique ID. Generated when omitted. |
| name | string | Name shown in the cursor label. |
| color | string | Any CSS color. Derived from the name when omitted. |
| status | string | Optional status message shown below the label. |
| visible | boolean | Whether the cursor is visible. Defaults to `true`. |
| position | KritzelAgenticCursorTarget | Initial position. Defaults to the center of the viewport. An object or element target attaches the cursor right away. |

## Moving a Cursor

Call `moveAgenticCursor()` with world coordinates, an object, or an [element inside an object](#pointing-at-elements). The cursor animates to its target, and the returned promise resolves when it arrives, so you can `await` each step of an agent run:

```ts
const editor = this.editor();

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
| attach | boolean | Whether the cursor sticks to an object or element target after arriving. Defaults to `true`. |

Object targets accept an `anchor` (`'center'`, `'top-left'`, `'top'`, `'top-right'`, `'right'`, `'bottom-right'`, `'bottom'`, `'bottom-left'`, or `'left'`) and an optional `offset` in world units. Anchors rotate with the object.

If you start a new move while a cursor is still moving, the cursor continues from its current position and the previous promise resolves with `{ completed: false }`. Moving to an object that does not exist rejects the promise.

## Attaching to Objects

When a cursor moves to an object, it sticks to that object once it arrives. It then stays on the chosen anchor while the object is dragged, resized, or rotated. Moving the cursor somewhere else releases it, and `detachAgenticCursor()` releases it in place:

```ts
await this.editor()?.detachAgenticCursor('planner');
```

If an object with an attached cursor is deleted, the cursor stays where the object was and the editor emits `agenticCursorDetached` with `reason: 'object-removed'`. A manual detach emits the same event with `reason: 'manual'`:

```html
<kritzel-editor (agenticCursorDetached)="onDetached($event)"></kritzel-editor>
```

```ts
onDetached(event: CustomEvent<KritzelAgenticCursorDetachedEvent>) {
  console.log(event.detail.id, event.detail.objectId, event.detail.reason);
}
```

## Pointing at Elements

A cursor can point at an element inside the page of an [iframe object](./dynamic-objects.md#interacting-with-iframe-content), for example the button an agent is about to press. Pass the object ID and a CSS selector. The first element that matches the selector is used:

```ts
const editor = this.editor();

await editor?.moveAgenticCursor('planner', {
  objectId: iframeObject.id,
  selector: '[data-kritzel-id="checkout"]',
});

// Point at the top-left corner of the element instead of its center
await editor?.moveAgenticCursor('planner', {
  objectId: iframeObject.id,
  selector: '[data-kritzel-id="checkout"]',
  anchor: 'top-left',
  offset: { x: 4, y: 4 },
});
```

`anchor` and `offset` work as for objects, but relative to the element's box. Element targets attach the cursor by default, so it follows the element when the element moves inside the page, for example because the layout changes or the page scrolls, and when the object is moved or rotated. Selectors built from a `data-kritzel-id` keep matching when the page is regenerated.

The object must be mounted, which it is while it is in or near the viewport, and the first element that matches the selector must be visible when the move starts. Otherwise the promise rejects. If the element disappears or is scrolled out of view later, for example while the page is regenerated, the cursor stays at the last position where the element was visible and returns to the element when it reappears.

An element can also be the initial position of a new cursor. The cursor starts at the center of the object and moves onto the element once the page has reported it:

```ts
await this.editor()?.addAgenticCursor({
  id: 'reviewer',
  name: 'Reviewer',
  position: { objectId: iframeObject.id, selector: '[data-kritzel-id="title"]' },
});
```

While a cursor is attached to an element, the `attachedTo` field of its snapshot includes the `selector`.

## Status Messages

Use `updateAgenticCursor()` to show what an agent is doing. The same method changes the name, color, or visibility of a cursor. Pass `null` as the status to hide the status message:

```ts
const editor = this.editor();

await editor?.updateAgenticCursor('planner', { status: 'Reviewing shapes' });
await editor?.updateAgenticCursor('planner', { status: null, color: '#16A34A' });
```

Call `removeAgenticCursor()` to remove a single cursor, or `clearAgenticCursors()` to remove all of them. `getAgenticCursor()` and `getAgenticCursors()` return snapshots that include the current position, the attached object, and whether the cursor is moving.

## API Details

For the full list of related APIs, see the following reference sections.

- [Agentic Cursors](../api-reference/editor.md#agentic-cursors)
- [Object Elements](../api-reference/editor.md#object-elements)
