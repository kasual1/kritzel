---
sidebar_label: Agents
displayed_sidebar: tutorialSidebar
title: "Agents | Kritzel for React"
description: "Add agents that work on the canvas next to people: a cursor you control from code, animated actions that edit objects, and an undo history of their own - for example for an AI assistant."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Agents

## Overview

An agent is a participant on the canvas that you drive from code instead of a pointer device, for example an AI assistant that reviews, arranges, or annotates the board. Each agent is a `KritzelAgent` with:

- **A cursor** with a name label, a color, and an optional status message. It flies smoothly to its targets and can stick to an object, so it follows that object while it is moved, resized, or rotated. When the cursor leaves the visible area, an indicator at the edge of the viewport points to it.
- **Actions** that change the canvas the way a person would: the cursor flies to the target, presses, and animates the change, for example dragging an object, drawing a stroke, or typing text.
- **Its own selection and undo history.** The user's undo never reverts an agent's work, and an agent's undo never reverts the user's.

Agents work next to people and never take an object away from them. An action on an object that the user or a collaborator is working on is refused or stops, and its result tells you why.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/agents/basic"
  repoFiles={['src/pages/advanced/agents/AgentsBasicPage.tsx']}
/>

## Adding an Agent

Create each agent once with `new KritzelAgent()`, for example in a lazy `useState` initializer, so that re-renders keep the same instance. Get a reference to the editor with `useRef` and add the agents with `addAgent()` once the editor emits `onIsReady`:

```tsx
import { useRef, useState } from 'react';
import { KritzelAgent, KritzelEditor, type HTMLKritzelEditorElement } from '@kritzel/react-editor';

export function AgentBoard() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [planner] = useState(() => new KritzelAgent({ id: 'planner', name: 'Planner', color: '#7C3AED' }));

  async function onReady() {
    await editorRef.current?.addAgent(planner);
    await planner.createShape({ x: 0, y: 0, width: 160, height: 80, text: 'Idea' });
  }

  return <KritzelEditor ref={editorRef} onIsReady={() => void onReady()} />;
}
```

The constructor accepts the following options. Only `name` is required:

| Option | Type | Description |
|--------|------|-------------|
| id | string | Unique ID. Generated (`agent-…`) when omitted. Objects that the agent creates get it as their `userId`. |
| name | string | Name shown in the cursor label. |
| color | string | Any CSS color. Derived from the name when omitted. |
| avatarUrl | string | URL of an avatar image, reported in `agentsChange`. |
| speed | number | Default speed of moves and actions in screen pixels per second. Defaults to `1200`. |
| status | string | Status message shown below the label. |
| visible | boolean | Whether the cursor is visible. Defaults to `true`. |
| position | KritzelAgenticTarget | Where the cursor appears. Defaults to the center of the viewport. An object target sticks the cursor to that object right away. |

`addAgent()` resolves with the same agent. Adding the same instance again does nothing, so it is safe to call on every `onIsReady`, also under React StrictMode. Adding a different agent with an ID that is already in use throws.

An agent belongs to one editor at a time. To move it to another editor, remove it first. When an editor is removed from the page, its agents stop working and can be added to another editor right away.

`removeAgent()` takes the agent or its ID. It rolls back the running action, resolves the queued actions with `'agent-removed'`, and drops the cursor, the selection, and the history of the agent. The agent itself stays usable and can be added again. `getAgent(id)` returns the live `KritzelAgent`, and `getAgents()` returns all agents of the editor:

```ts
const editor = editorRef.current;

const planner = await editor?.getAgent('planner');
await editor?.removeAgent('planner');
```

## Presence

The presence methods change what the cursor shows. They take effect at once and never wait for running actions:

```ts
planner.setStatus('Reviewing shapes'); // shown below the label
planner.setStatus(null); // hides the status message
planner.name = 'Reviewer';
planner.color = '#16A34A';
planner.hide(); // the agent keeps working without a visible cursor
planner.show();
```

`moveTo()` animates the cursor to world coordinates or to an anchor on an object. The returned promise resolves when the cursor arrives, so you can `await` each step:

```ts
// Move to a point in world coordinates
await planner.moveTo({ x: 200, y: 120 });

// Move to the top-right corner of an object
await planner.moveTo({ objectId: shape.id, anchor: 'top-right' });

// Override the timing of a single move
await planner.moveTo({ x: 0, y: 0 }, { duration: 800, easing: 'ease-out' });
```

By default the duration depends on the distance, so short moves are quick and long moves never take more than about a second. Use the move options to change this:

| Option | Type | Description |
|--------|------|-------------|
| duration | number | Fixed duration in milliseconds. Overrides the distance-based duration. |
| easing | KritzelEasing | `'linear'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'` (default), or a custom `(t: number) => number` function. |
| speed | number | Speed in screen pixels per second for the distance-based duration. Defaults to the agent's `speed`. |
| attach | boolean | Whether the cursor sticks to an object target after arriving. Defaults to `true`. |

Object targets accept an `anchor` (`'center'`, `'top-left'`, `'top'`, `'top-right'`, `'right'`, `'bottom-right'`, `'bottom'`, `'bottom-left'`, or `'left'`) and an optional `offset` in world units. Anchors rotate with the object.

If you call `moveTo()` while the cursor is still moving, the cursor continues from its current position and the previous promise resolves with `{ completed: false }`. A running action of the agent stops with `'agent-moved'`. Moving to an object that does not exist rejects the promise.

Once the cursor arrives at an object, it sticks to it and stays on the chosen anchor while the object is dragged, resized, or rotated. After an action, the cursor rests on the object it worked on. Moving the cursor somewhere else releases it, and `detach()` releases it in place. If the object is deleted, the cursor stays where the object was. The agent emits `detached` after `detach()` and when the object is deleted:

```ts
const off = planner.on('detached', ({ objectId, reason }) => {
  console.log(objectId, reason); // reason is 'object-removed' or 'manual'
});

off(); // unsubscribes
```

To show the agents in your own UI, for example as a list of who is working, listen to `agentsChange`. It is emitted when agents are added or removed, and when their name, color, avatar, status, visibility, or activity changes, but never for plain cursor motion:

```tsx
const [agents, setAgents] = useState<KritzelAgentPresence[]>([]);

return <KritzelEditor ref={editorRef} onAgentsChange={event => setAgents(event.detail.agents)} />;
```

## Performing Actions

Actions let an agent work on the canvas itself. The cursor flies to the target, presses, and animates the change. The changes are saved and synced like the user's edits, but they are recorded in the agent's own history. Objects that an agent selects are outlined in its color and never change the user's selection.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/agents/actions"
  repoFiles={['src/pages/advanced/agents/AgentsActionsPage.tsx']}
/>

Every action is a method of the agent and resolves with a result when it ends:

```ts
const result = await planner.moveObject(shape.id, { x: 400, y: 120 });

if (!result.completed) {
  console.log('Stopped:', result.reason);
}
```

Coordinates and sizes are in world units:

| Method | Description |
|--------|-------------|
| `click(target, { count? })` | Presses at a point or an object anchor. Nothing changes; `objectIds` contains the object under the cursor. `count: 2` plays a double press. |
| `select(objectIds, { additive? })` | Selects objects for the agent. `additive: true` adds them to the agent's selection. |
| `clearSelection()` | Clears the agent's selection. |
| `moveObject(objectId, to, { align? })` | Drags an object so that its `align` point (default `'center'`) lands on `to`, a point or an object anchor. |
| `resizeObject(objectId, { width?, height?, keepAspectRatio?, handle? })` | Drags a corner handle until the object has the new size. The opposite corner stays in place. |
| `rotateObject(objectId, angle, { relative? })` | Turns the object with the rotation handle. `angle` is in degrees, clockwise. |
| `createShape({ x, y, width, height, shapeType?, text?, style? })` | Drags out a new shape and optionally types text into it. |
| `createText({ x, y, text, style? })` | Creates a text object and types into it. |
| `typeText(objectId, text, { mode? })` | Types into a text or shape. `mode: 'replace'` clears it first. |
| `drawPath(points, { style? })` | Draws a freehand stroke through the points. |
| `connect(fromId, toId, { style? })` | Draws a line between two objects and anchors both ends, so the line follows them. |
| `setStyle(objectIds, style)` | Changes fill, stroke, opacity, font, or arrows. Fields that don't apply to an object are ignored, and groups style their children. |
| `addObject(object)` | Places an object that your app built, for example a `KritzelIframeObject`. |
| `deleteObjects(objectIds)` | Deletes objects. |
| `undo()`, `redo()` | Undoes or redoes the agent's last action. |

Actions work on top-level objects. Objects that an action creates use the current settings of the matching tool unless you pass a `style`. Colors are any CSS color or a theme-aware `{ light, dark }` color:

```ts
await planner.setStyle([shape.id], { fillColor: '#DCFCE7', strokeColor: '#16A34A', strokeWidth: 4 });
await planner.drawPath(points, { style: { strokeColor: '#7C3AED', strokeWidth: 6 } });
```

`addObject()` places objects that have no action of their own, such as images, iframes, or dynamic objects. The cursor hops to the object and it appears as the agent's change. The object gets a new ID, which `objectIds` reports. Unlike the editor's `addObject()`, the user's selection and undo history stay untouched:

```ts
const result = await planner.addObject(
  new KritzelIframeObject({ translateX: 0, translateY: 0, width: 400, height: 300, html: '<h1>Summary</h1>' }),
);

const iframeId = result.objectIds?.[0];
```

`perform()` runs the same actions from an action object, which is useful when the steps come from data:

```ts
await planner.perform({ type: 'moveObject', objectId: shape.id, to: { x: 400, y: 120 } });
```

Actions of one agent run one after another, in the order you call them, while different agents work at the same time:

```ts
await Promise.all([
  planner.moveObject(rectangle.id, { x: 300, y: 0 }),
  writer.createText({ x: -200, y: 160, text: 'Moved the rectangle' }),
]);
```

Every action accepts options as its last argument:

| Option | Type | Description |
|--------|------|-------------|
| speed | number | Speed in screen pixels per second. Defaults to the agent's `speed`. Also scales presses, drags, drawing, and typing. |
| instant | boolean | Skips all animation and applies the change at once. Defaults to `false`. |
| signal | AbortSignal | Stops the action, also while it waits for earlier actions of the agent. Its changes are rolled back. |
| easing | KritzelEasing | Easing of the cursor flight and of drags. Defaults to `'ease-in-out'`. |

## Tasks and Cancelling

A script of several actions usually has to stop at the first step that does not complete. `task()` does this for you: it shows its label as the status while it runs, and the first action that does not complete throws a `KritzelAgentActionError` out of the task. The previous status comes back when the task ends:

```ts
import { KritzelAgentActionError } from '@kritzel/react-editor';

try {
  await planner.task('Linking ideas', async () => {
    const created = await planner.createShape({ x: 0, y: 0, width: 160, height: 80, text: 'Plan' });
    await planner.connect(created.objectIds![0], target.id);
    await planner.setStyle([target.id], { strokeColor: '#7C3AED' });
  });
} catch (error) {
  if (error instanceof KritzelAgentActionError) {
    console.log(`${error.action.type} stopped: ${error.reason}`, error.objectIds);
  } else {
    throw error;
  }
}
```

An agent runs one task at a time. Calling `task()` while another task of the agent is running throws.

`cancel()` stops everything the agent is doing: the running action is rolled back and the queued actions resolve with `'aborted'`. Inside a task, every later action resolves as aborted, and therefore throws, until the task returns:

```tsx
<button onClick={() => planner.cancel()}>Stop</button>
```

To stop a single action, pass an `AbortSignal`:

```ts
const controller = new AbortController();
const stroke = planner.drawPath(points, { signal: controller.signal });

controller.abort(); // the stroke is removed again and resolves with reason 'aborted'
```

## Results and Conflicts

Every action resolves with `{ completed, reason?, objectIds? }`. `completed` is `false` when the action was refused or stopped, and `reason` says why. On success, `objectIds` contains the created or added object, the new selection of the agent, the changed or deleted objects, the object under a click, or the objects changed by undo or redo. On failure, it contains the objects that caused it, when known. An invalid action, or an agent that is not added to an editor, rejects the promise instead.

Agents never take an object away from a person:

- An object that the user has selected is refused with `'user-selected'`. If the user selects or grabs an object while an agent is working on it, the agent stops with `'user-selected'` or `'user-interaction'` and keeps what it has done so far as one step of its history.
- An object that a collaborator has selected or is editing is refused with `'collaborator-editing'`. If this happens while the agent is working on it, the agent stops and rolls its change back.
- An object that another agent is working on or has selected is refused with `'claimed-by-agent'`.

| Reason | Description |
|--------|-------------|
| `'aborted'` | The `signal` was aborted or `cancel()` was called. |
| `'agent-moved'` | `moveTo()` was called while the action was running. |
| `'agent-removed'` | The agent was removed while the action was queued or running. |
| `'object-removed'` | A target was deleted while the action was running. |
| `'user-selected'` | The user has a target selected. |
| `'user-interaction'` | The user is dragging, resizing, rotating, drawing on, editing, or erasing a target. |
| `'collaborator-editing'` | A collaborator has a target selected or is editing it. |
| `'claimed-by-agent'` | Another agent's running action or selection covers a target. |
| `'workspace-changed'` | The workspace was switched, reloaded, or deleted. |
| `'not-allowed'` | The object configuration forbids the change, for example resizing or rotating. |
| `'invalid-target'` | An ID is unknown, belongs to an object inside a group, or has the wrong type. |
| `'conflict'` | A target was changed elsewhere during the action, or the history step of the agent is outdated. |
| `'nothing-to-undo'`, `'nothing-to-redo'` | The agent has no step to undo or redo. |
| `'engine-disconnected'` | No workspace is ready, for example while the editor is loading or after it was removed from the page. |

Apart from a takeover by the user, a stopped action is rolled back.

When someone takes over the objects of a running action, the agent emits `interrupted`. `keptChanges` tells you whether the partial change was kept:

```ts
planner.on('interrupted', ({ action, reason, objectIds, keptChanges }) => {
  console.log(`${action.type} interrupted (${reason})`, objectIds, keptChanges);
});
```

## Agent History

Each agent has its own undo history. `undo()` reverts the agent's last action and `redo()` applies it again. They never touch the changes of the user or of other agents, and the user's undo and redo never touch agent changes. Like any other action, an undo is refused when someone is working on its objects.

`agent.state` is a snapshot of the agent, including `canUndo` and `canRedo`. To render it, mirror it into React state with the `change` event, which is emitted when the state changes, but not for plain cursor motion. `on()` returns the function that unsubscribes:

```tsx
const [plannerState, setPlannerState] = useState(() => planner.state);

useEffect(() => planner.on('change', setPlannerState), [planner]);

return (
  <button disabled={!plannerState.canUndo} onClick={() => void planner.undo()}>
    Undo agent
  </button>
);
```

The history belongs to the open workspace. It is lost when the agent is removed or the workspace is switched. When the user takes over an action with `'user-selected'` or `'user-interaction'`, the partial change becomes one step of the history. When a collaborator takes over with `'collaborator-editing'`, the change is rolled back and leaves no step.

## Telling Agent Changes Apart

Objects that an agent creates have the agent's ID as their `userId`. `objectsAdded`, `objectsUpdated`, and `objectsRemoved` carry a `source` when an agent made the change. It names the agent and the action, which is `'undo'` or `'redo'` for the agent's own history:

```tsx
<KritzelEditor
  ref={editorRef}
  onObjectsUpdated={event => {
    const source = event.detail.source;
    if (source?.type === 'agent') {
      console.log(`${source.agentId} ran ${source.actionType}`);
    }
  }}
/>
```

Changes by the user, by collaborators, and by the user's undo and redo have no `source`.

## API Details

For the full list of related APIs, see the following reference sections.

- [Agent](../api-reference/agent.md)
- [Editor: Agents](../api-reference/editor.md#agents)
