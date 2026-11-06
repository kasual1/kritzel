---
sidebar_label: Agent
displayed_sidebar: tutorialSidebar
title: "Agent API Reference | Kritzel for Vue"
description: "API reference for KritzelAgent: constructor options, properties, state, presence and action methods, events, errors, and related types."
toc_max_heading_level: 2
---

# Agent

`KritzelAgent` is a participant on the canvas that is driven by code instead of a pointer device, for example an AI assistant. An agent has a cursor, a name and a color, and its own selection, action queue, and undo history. Create an agent, add it to the editor with `addAgent()` once the editor is ready, then let it act:

```ts
import { KritzelAgent } from '@kritzel/vue-editor';

const agent = new KritzelAgent({ name: 'Planner', color: '#7C3AED' });

await editor.addAgent(agent);
await agent.createShape({ x: 0, y: 0, width: 160, height: 80, text: 'Idea' });
```

For a guided introduction, see [Agents](../advanced/agents.md). The editor methods `addAgent`, `removeAgent`, `getAgent`, and `getAgents`, and the `agentsChange` event are listed in the [Editor API Reference](./editor.md#agents).

## Constructor

```ts
new KritzelAgent(options: KritzelAgentOptions)
```

Throws a `TypeError` when `name` is missing or empty.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| id | string | `'agent-…'` | Unique ID. Becomes the `userId` of the objects the agent creates. |
| name | string | — | Required. Name shown in the cursor label. |
| color | string | Derived from the name | Any CSS color for the cursor, its label, and the agent's selection. |
| avatarUrl | string | — | URL of an avatar image, reported in `agentsChange`. |
| speed | number | `1200` | Default speed of moves and actions in screen pixels per second. |
| broadcast | boolean | `true` | Reserved for sharing the agent's presence. Has no effect yet. |
| status | string | — | Status message shown below the cursor label. |
| visible | boolean | `true` | Whether the cursor is visible. |
| position | KritzelAgenticTarget | Center of the viewport | Where the cursor appears when the agent is added. An object target sticks the cursor to that object. |

`isKritzelAgent(value)` returns whether a value is a `KritzelAgent`, also when it comes from another copy of the package.

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| id | string | Read-only. Unique ID; the `userId` of the objects the agent creates. |
| kind | `'agent'` | Read-only. Always `'agent'`. |
| name | string | Name shown in the cursor label. Setting it renames the label. |
| displayName | string | Read-only. Same as `name`, so an agent can be used where an `IKritzelUser` is expected. |
| color | string | Any CSS color. Setting it recolors the cursor and the agent's selection. |
| avatarUrl | string \| undefined | URL of the avatar image. |
| profileImageUrl | string \| undefined | Read-only. Same as `avatarUrl`. |
| speed | number \| undefined | Default speed of moves and actions in screen pixels per second. `undefined` uses `1200`. |
| broadcast | boolean | Reserved for sharing the agent's presence. Has no effect yet. |
| isAdded | boolean | Read-only. Whether the agent is added to an editor. |
| state | KritzelAgentState | Read-only. A snapshot of the agent's state. See [State](#state). |

---

## State

`agent.state` returns a new `KritzelAgentState` snapshot on every read. Subscribe to the [`change` event](#events) to be notified when it changes.

| Field | Type | Description |
|-------|------|-------------|
| isAdded | boolean | Whether the agent is added to an editor. |
| position | KritzelPoint \| null | Cursor position in world coordinates, or `null` while the agent is not added. |
| attachedTo | KritzelAgenticAttachment \| null | The object the cursor sticks to, or `null`. |
| isMoving | boolean | Whether the cursor is animating. |
| status | string \| null | The status message, or `null`. |
| visible | boolean | Whether the cursor is visible. |
| selection | string[] | IDs of the objects the agent selected with `select()`. |
| activeAction | KritzelAgenticActionType \| null | Type of the running action, or `null` when the agent is idle. |
| queueLength | number | Number of actions waiting behind the running one. |
| canUndo | boolean | Whether `undo()` has a step to undo. |
| canRedo | boolean | Whether `redo()` has a step to redo. |

While the agent is not added, `status` and `visible` keep their values and every other field has its empty default.

---

## Presence

Presence methods change what the cursor shows. They take effect at once and never wait for running actions.

### setStatus

Shows a status message below the cursor label. `null` or an empty string hides it.

```ts
setStatus(status: string | null): void
```

### show

Shows the cursor.

```ts
show(): void
```

### hide

Hides the cursor. The agent keeps working.

```ts
hide(): void
```

### moveTo

Animates the cursor to a point in world coordinates or to an anchor on an object, where it sticks by default. Resolves when the cursor arrives; `completed` is `false` when another move, the removal of the agent, or the deletion of the target interrupted it. A running action of the agent stops with `'agent-moved'`. Rejects when the agent is not added, for an invalid target, and for an object that does not exist.

```ts
moveTo(target: KritzelAgenticTarget, options?: KritzelAgenticMoveOptions): Promise<KritzelAgenticMoveResult>
```

### detach

Releases the cursor from the object it sticks to. The cursor stays where it is, and the agent emits `detached` with `reason: 'manual'`.

```ts
detach(): void
```

### toPresence

Returns the agent as it appears in the `agentsChange` event of the editor.

```ts
toPresence(): KritzelAgentPresence
```

---

## Actions

In an action, the cursor flies to the target, presses, and animates the change. Changes are saved and synced like the user's edits, but they are recorded in the agent's own history. Actions of one agent run one after another, in the order they are called, while different agents work at the same time.

Every action resolves with a [`KritzelAgenticActionResult`](#kritzelagenticactionresult) when it ends. `completed` is `false` with a `reason` when the action was refused or stopped. The promise rejects for an invalid action (`TypeError`) and when the agent is not added to an editor. Inside [`task()`](#task), an action that does not complete throws a [`KritzelAgentActionError`](#kritzelagentactionerror) instead.

Object IDs must belong to top-level objects. Every action takes [`KritzelAgenticActionOptions`](#kritzelagenticactionoptions) as its last argument.

### perform

Performs an action from an action object. All other action methods are shortcuts for it.

```ts
perform(action: KritzelAgenticAction, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### click

Presses at a point or an object anchor. Nothing changes; `objectIds` holds the object under the cursor, or is empty on a miss. `count: 2` plays a double press.

```ts
click(target: KritzelAgenticTarget, options?: { count?: 1 | 2 } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### select

Selects objects for the agent. Agent selections are outlined in the agent's color and never change the user's selection. `additive: true` adds to the agent's selection instead of replacing it.

```ts
select(objectIds: string[], options?: { additive?: boolean } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### clearSelection

Clears the agent's selection.

```ts
clearSelection(options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### moveObject

Drags an object so that its `align` point (default `'center'`) lands on `to`, a point or an anchor on another object.

```ts
moveObject(objectId: string, to: KritzelAgenticTarget, options?: { align?: KritzelAgenticAnchor } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### resizeObject

Drags a corner handle (default `'bottom-right'`) until the object has the new size; the opposite corner stays in place. Sizes are in world units of the unrotated object. At least one of `width` and `height` is required. `keepAspectRatio` defaults to `true` when only one of them is given.

```ts
resizeObject(
  objectId: string,
  size: { width?: number; height?: number; keepAspectRatio?: boolean; handle?: KritzelAgenticResizeHandle },
  options?: KritzelAgenticActionOptions,
): Promise<KritzelAgenticActionResult>
```

### rotateObject

Turns an object with the rotation handle to `angle` degrees clockwise, the short way round, or by `angle` degrees with `relative: true`.

```ts
rotateObject(objectId: string, angle: number, options?: { relative?: boolean } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### createShape

Drags out a new shape with its top-left corner at `x`, `y` and optionally types `text` into it, in one step of the agent's history. `shapeType` and unset `style` fields default to the shape tool's current settings. `objectIds` holds the ID of the new shape.

```ts
createShape(
  shape: { x: number; y: number; width: number; height: number; shapeType?: ShapeType; text?: string; style?: KritzelAgenticShapeStyle },
  options?: KritzelAgenticActionOptions,
): Promise<KritzelAgenticActionResult>
```

### createText

Creates a text object with its top-left corner at `x`, `y` and types `text` into it. `\n` starts a new paragraph. `objectIds` holds the ID of the new text.

```ts
createText(
  text: { x: number; y: number; text: string; style?: KritzelAgenticTextStyle },
  options?: KritzelAgenticActionOptions,
): Promise<KritzelAgenticActionResult>
```

### typeText

Types into a text or a shape. `mode: 'append'` (default) types after the existing content, `mode: 'replace'` clears it first.

```ts
typeText(objectId: string, text: string, options?: { mode?: 'append' | 'replace' } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### drawPath

Draws a freehand stroke through at least two points in world coordinates.

```ts
drawPath(points: KritzelPoint[], options?: { style?: KritzelAgenticStrokeStyle } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### connect

Draws a line from one object to another and anchors both ends, so the line follows the objects.

```ts
connect(from: string, to: string, options?: { style?: KritzelAgenticLineStyle } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### setStyle

Restyles objects; groups style their children. `style` needs at least one field. Fields apply where they make sense and are ignored elsewhere: `fillColor` to shapes; `strokeColor` and `strokeWidth` to shapes, strokes, and lines; `fontSize`, `fontFamily`, and `fontColor` to shapes and texts; `arrows` to lines; `opacity` to all objects.

```ts
setStyle(objectIds: string[], style: KritzelAgenticObjectStyle, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### addObject

Places an object that the app built, for example a `KritzelIframeObject`, as the agent's change: the cursor hops to the object and it appears. The object gets a new ID, which `objectIds` reports. Unlike the editor's `addObject()`, the user's selection and undo history stay untouched. Selections can't be added.

```ts
addObject(object: KritzelBaseObject, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### deleteObjects

Deletes objects. Children of a group are deleted with their group.

```ts
deleteObjects(objectIds: string[], options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### undo

Undoes the agent's last action. Never touches the history of the user or of other agents. Resolves with `'nothing-to-undo'` when the agent's history is empty.

```ts
undo(options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### redo

Redoes the agent's last undone action. Resolves with `'nothing-to-redo'` when there is nothing to redo.

```ts
redo(options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

---

## Control

### cancel

Stops the running action, rolling its changes back, and drops the queued actions. They resolve with `reason: 'aborted'`. Inside `task()`, every later action resolves as aborted, and therefore throws, until the task returns.

```ts
cancel(): void
```

### task

Runs a script of actions as one task. `label` is shown as the status while the task runs, and the previous status comes back when it ends. The first action that does not complete throws a `KritzelAgentActionError` out of `fn`. An agent runs one task at a time; calling `task()` while another task of the agent is running rejects.

```ts
task<T>(label: string, fn: () => Promise<T> | T): Promise<T>
```

---

## Events

### on

Subscribes to an event of the agent and returns a function that unsubscribes. Errors thrown by a listener are logged and don't affect other listeners.

```ts
on<K extends keyof KritzelAgentEventMap>(event: K, listener: (payload: KritzelAgentEventMap[K]) => void): () => void
```

| Event | Payload Type | Description |
|-------|--------------|-------------|
| change | KritzelAgentState | The state changed: status, visibility, name, color, avatar, activity, selection, history, or attachment. Not emitted for plain cursor motion. |
| detached | KritzelAgentDetachedEvent | The cursor stopped sticking to an object, because the object was deleted (`'object-removed'`) or after `detach()` (`'manual'`). |
| interrupted | KritzelAgentInterruptedEvent | Someone took over the objects of a running action: the user selected or grabbed them, a collaborator started editing them, or they were changed elsewhere. |
| removed | void | The agent was removed from its editor. |

The editor emits `agentsChange` with a [`KritzelAgentsChangeEvent`](#kritzelagentschangeevent) when agents are added or removed, or when their presence changes.

---

## Errors

### KritzelAgentActionError

Thrown inside `task()` when an action of the agent does not complete, for example because the user has the target selected.

```ts
class KritzelAgentActionError extends Error {
  readonly name: 'KritzelAgentActionError';
  /** The action that did not complete. */
  readonly action: KritzelAgenticAction;
  /** Its result, with `completed: false`. */
  readonly result: KritzelAgenticActionResult;
  /** Why the action did not complete. */
  readonly reason: KritzelAgenticActionFailureReason | undefined;
  /** The objects that caused it, when known. */
  readonly objectIds: string[];
}
```

```ts
import { KritzelAgentActionError } from '@kritzel/vue-editor';

try {
  await agent.task('Arranging', async () => {
    await agent.moveObject(shape.id, { x: 200, y: 0 });
  });
} catch (error) {
  if (error instanceof KritzelAgentActionError && error.reason === 'user-selected') {
    // The user is working on the shape
  }
}
```

### Other Errors

| Situation | Error |
|-----------|-------|
| `new KritzelAgent()` without a `name` | Throws a `TypeError`. |
| An action or `moveTo()` while the agent is not added | Rejects with an `Error`. |
| An action with an unknown `type` or invalid fields | Rejects with a `TypeError`. |
| `moveTo()` with an invalid target or to an object that does not exist | Rejects with an `Error`. |
| `task()` while another task of the agent is running | Rejects with an `Error`. |
| `addAgent()` with a value that is not a `KritzelAgent` | Rejects with a `TypeError`. |
| `addAgent()` with a second agent that has the same ID, or with an agent of another editor | Rejects with an `Error`. |

Runtime conditions, such as a user who has a target selected, never reject. They resolve with `completed: false` and a [failure reason](#kritzelagenticactionfailurereason).

---

## Related Types

### KritzelAgentOptions

Passed to the [constructor](#constructor).

```ts
interface KritzelAgentOptions {
  id?: string;
  name: string;
  color?: string;
  avatarUrl?: string;
  speed?: number;
  broadcast?: boolean;
  status?: string;
  visible?: boolean;
  position?: KritzelAgenticTarget;
}
```

### KritzelAgentState

Returned by [`agent.state`](#state) and passed to `change` listeners.

```ts
interface KritzelAgentState {
  isAdded: boolean;
  position: KritzelPoint | null;
  attachedTo: KritzelAgenticAttachment | null;
  isMoving: boolean;
  status: string | null;
  visible: boolean;
  selection: string[];
  activeAction: KritzelAgenticActionType | null;
  queueLength: number;
  canUndo: boolean;
  canRedo: boolean;
}
```

### KritzelAgentPresence

An agent as reported by `toPresence()` and `agentsChange`. `displayName` and `profileImageUrl` repeat `name` and `avatarUrl` for components that render `IKritzelUser` objects. `isRemote` is `false` for agents added to this editor.

```ts
interface KritzelAgentPresence {
  id: string;
  kind: 'agent';
  name: string;
  displayName: string;
  color: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  status: string | null;
  visible: boolean;
  activeAction: KritzelAgenticActionType | null;
  queueLength: number;
  isRemote: boolean;
}
```

### KritzelAgentsChangeEvent

Detail of the editor's `agentsChange` event. Emitted when agents are added or removed, or when their name, color, avatar, status, visibility, or activity changes. Never emitted for plain cursor motion.

```ts
interface KritzelAgentsChangeEvent {
  agents: KritzelAgentPresence[];
}
```

### KritzelAgentEventMap

The events of [`agent.on()`](#on) and their payloads.

```ts
interface KritzelAgentEventMap {
  change: KritzelAgentState;
  detached: KritzelAgentDetachedEvent;
  interrupted: KritzelAgentInterruptedEvent;
  removed: void;
}

interface KritzelAgentDetachedEvent {
  objectId: string;
  reason: 'object-removed' | 'manual';
}

interface KritzelAgentInterruptedEvent {
  action: KritzelAgenticAction;
  reason: KritzelAgenticActionFailureReason;
  /** The objects that caused the interruption. */
  objectIds: string[];
  /** Whether the changes made before the interruption were kept as one step of the agent's history. */
  keptChanges: boolean;
}
```

`interrupted` is emitted for the reasons `'user-selected'`, `'user-interaction'`, `'collaborator-editing'`, and `'conflict'` once the action has started. Changes are kept only when the user took over (`'user-selected'` or `'user-interaction'`).

### KritzelAgenticTarget

A point in world coordinates or an anchor on an object. Used by `moveTo()`, `click()`, `moveObject()`, and the `position` option. Anchors rotate with the object, and `offset` is in world units of the object's unrotated space.

```ts
type KritzelAgenticTarget = KritzelAgenticPointTarget | KritzelAgenticObjectTarget;

interface KritzelAgenticPointTarget {
  x: number;
  y: number;
}

interface KritzelAgenticObjectTarget {
  objectId: string;
  anchor?: KritzelAgenticAnchor; // defaults to 'center'
  offset?: KritzelPoint;
}

type KritzelAgenticAnchor =
  | 'center' | 'top-left' | 'top' | 'top-right' | 'right'
  | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';

interface KritzelAgenticAttachment {
  objectId: string;
  anchor: KritzelAgenticAnchor;
  offset: KritzelPoint;
}
```

### KritzelAgenticMoveOptions

Passed to `moveTo()`.

```ts
interface KritzelAgenticMoveOptions {
  /** Fixed duration in milliseconds. When omitted, the duration follows from the distance and `speed`. */
  duration?: number;
  /** Defaults to 'ease-in-out'. */
  easing?: KritzelEasing;
  /** Screen pixels per second. Defaults to the agent's `speed`, or 1200. */
  speed?: number;
  /** Whether the cursor sticks to an object target after arriving. Defaults to true. */
  attach?: boolean;
}

interface KritzelAgenticMoveResult {
  completed: boolean;
}

type KritzelEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);
```

### KritzelAgenticAction

Passed to `perform()`. Each action method builds one of these objects. Coordinates and sizes are in world units, angles in degrees.

```ts
type KritzelAgenticAction =
  | { type: 'click'; target: KritzelAgenticTarget; count?: 1 | 2 }
  | { type: 'select'; objectIds: string[]; additive?: boolean }
  | { type: 'clearSelection' }
  | { type: 'moveObject'; objectId: string; to: KritzelAgenticTarget; align?: KritzelAgenticAnchor }
  | { type: 'resizeObject'; objectId: string; width?: number; height?: number; keepAspectRatio?: boolean; handle?: KritzelAgenticResizeHandle }
  | { type: 'rotateObject'; objectId: string; angle: number; relative?: boolean }
  | { type: 'createShape'; x: number; y: number; width: number; height: number; shapeType?: ShapeType; text?: string; style?: KritzelAgenticShapeStyle }
  | { type: 'createText'; x: number; y: number; text: string; style?: KritzelAgenticTextStyle }
  | { type: 'typeText'; objectId: string; text: string; mode?: 'append' | 'replace' }
  | { type: 'drawPath'; points: KritzelPoint[]; style?: KritzelAgenticStrokeStyle }
  | { type: 'connect'; from: string; to: string; style?: KritzelAgenticLineStyle }
  | { type: 'setStyle'; objectIds: string[]; style: KritzelAgenticObjectStyle }
  | { type: 'addObject'; object: KritzelBaseObject }
  | { type: 'deleteObjects'; objectIds: string[] }
  | { type: 'undo' }
  | { type: 'redo' };

type KritzelAgenticActionType = KritzelAgenticAction['type'];

type KritzelAgenticResizeHandle = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
```

Each member is also exported as its own interface, for example `KritzelAgenticMoveObjectAction`, `KritzelAgenticSetStyleAction`, and `KritzelAgenticAddObjectAction`.

### Style Types

Styles of created and restyled objects. Colors are any CSS color or a theme-aware `{ light, dark }` color. Unset fields of a created object use the current settings of the matching tool.

```ts
type KritzelAgenticColor = string | ThemeAwareColor;

interface KritzelAgenticShapeStyle {
  fillColor?: KritzelAgenticColor;
  strokeColor?: KritzelAgenticColor;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: KritzelAgenticColor;
}

interface KritzelAgenticTextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontColor?: KritzelAgenticColor;
  opacity?: number;
}

interface KritzelAgenticStrokeStyle {
  strokeColor?: KritzelAgenticColor;
  strokeWidth?: number;
  opacity?: number;
}

interface KritzelAgenticLineStyle extends KritzelAgenticStrokeStyle {
  arrows?: LineArrowConfig;
}

interface KritzelAgenticObjectStyle {
  fillColor?: KritzelAgenticColor;
  strokeColor?: KritzelAgenticColor;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: KritzelAgenticColor;
  arrows?: LineArrowConfig;
}
```

### KritzelAgenticActionOptions

The last argument of every action.

```ts
interface KritzelAgenticActionOptions {
  /** Screen pixels per second. Defaults to the agent's `speed`, or 1200. Also scales presses, drags, drawing, and typing. */
  speed?: number;
  /** Skips all animation and applies the change at once. Defaults to false. */
  instant?: boolean;
  /** Stops the action, also while it waits in the queue. Its changes are rolled back. */
  signal?: AbortSignal;
  /** Easing of the cursor flight and of drags. Defaults to 'ease-in-out'. */
  easing?: KritzelEasing;
}
```

### KritzelAgenticActionResult

Returned by every action.

```ts
interface KritzelAgenticActionResult {
  /** true when the action ran to the end. */
  completed: boolean;
  /** Set only when `completed` is false. */
  reason?: KritzelAgenticActionFailureReason;
  /**
   * On success: the created or added object, the new selection of the agent, the changed or deleted objects,
   * the object under a click (empty on a miss), or the objects changed by undo or redo.
   * On failure: the objects that caused it, when known.
   */
  objectIds?: string[];
}
```

### KritzelAgenticActionFailureReason

Why an action did not complete. See [Results and Conflicts](../advanced/agents.md#results-and-conflicts) for a description of each reason. Apart from `'user-selected'` and `'user-interaction'`, the changes of a stopped action are rolled back.

```ts
type KritzelAgenticActionFailureReason =
  | 'aborted'
  | 'agent-moved'
  | 'agent-removed'
  | 'object-removed'
  | 'user-selected'
  | 'user-interaction'
  | 'collaborator-editing'
  | 'claimed-by-agent'
  | 'workspace-changed'
  | 'not-allowed'
  | 'nothing-to-undo'
  | 'nothing-to-redo'
  | 'conflict'
  | 'invalid-target'
  | 'engine-disconnected';
```

### KritzelAgentChangeSource

The `source` of the `objectsAdded`, `objectsUpdated`, and `objectsRemoved` events when an agent made the change. `actionType` is `'undo'` or `'redo'` for changes from the agent's own history. Changes by the user, collaborators, sync, and the user's undo and redo have no `source`.

```ts
interface KritzelAgentChangeSource {
  type: 'agent';
  agentId: string;
  actionType: KritzelAgenticActionType;
}
```
