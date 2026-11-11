---
sidebar_label: Agent
displayed_sidebar: tutorialSidebar
title: "Agent API Reference | Kritzel for React"
description: "API reference for KritzelAgent: constructor options, properties, state, presence and action methods, events, errors, and related types."
toc_max_heading_level: 2
---

# Agent

`KritzelAgent` is a participant on the canvas that is driven by code instead of a pointer device, for example an AI assistant. An agent has a cursor, a name and a color, and its own selection, action queue, and undo history. Create an agent, add it to the editor with `addAgent()` once the editor is ready, then let it act:

```ts
import { KritzelAgent } from '@kritzel/react-editor';

const agent = new KritzelAgent({ name: 'Planner', color: '#7C3AED' });

await editor.addAgent(agent);
await agent.createShape({ x: 0, y: 0, width: 160, height: 80, text: 'Idea' });
```

For a guided introduction, see [Agents](../advanced/agents.md). The editor methods `addAgent`, `removeAgent`, `getAgent`, `getAgents`, and `getRemoteAgents`, and the `agentsChange` event are listed in the [Editor API Reference](./editor.md#agents). Collaborators see agents through presence, as described in [Collaboration](#collaboration), and [`tools()`](#tools) hands an agent to an LLM.

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
| avatarUrl | string | — | URL of an avatar image, shown in the avatar stack and reported in `agentsChange`. Initials of the name are shown when omitted. |
| speed | number | `1200` | Default speed of moves and actions in screen pixels per second. |
| broadcast | boolean | `true` | Whether collaborators see the agent. See [Collaboration](#collaboration). |
| status | string | — | Status message shown below the cursor label. |
| visible | boolean | `true` | Whether the cursor is visible. |
| position | KritzelAgenticTarget | Center of the viewport | Where the cursor starts when the agent is added. An object target sticks the cursor to that object. An element target starts at the center of the object and sticks the cursor to the element once the page has reported it. If the object does not exist then, for example because it was deleted or the editor shows another document, the cursor starts at the center of the viewport. |

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
| broadcast | boolean | Whether collaborators see the agent. Setting it takes effect at once: `false` removes the agent from the presence of collaborators, `true` shares it again. Objects that the agent changes sync either way. |
| isAdded | boolean | Read-only. Whether the agent is added to an editor. |
| state | KritzelAgentState | Read-only. A snapshot of the agent's state. See [State](#state). |

---

## State

`agent.state` returns a new `KritzelAgentState` snapshot on every read. Subscribe to the [`change` event](#events) to be notified when it changes.

| Field | Type | Description |
|-------|------|-------------|
| isAdded | boolean | Whether the agent is added to an editor. |
| position | KritzelPoint \| null | Cursor position in world coordinates, or `null` while the agent is not added. |
| attachedTo | KritzelAgenticAttachment \| null | The object the cursor sticks to, or `null`. Includes the `selector` while it sticks to an element inside the object. |
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

Animates the cursor to a point in world coordinates, to an anchor on an object, or to an element inside an object's content, such as a button in an iframe object (`{ objectId, selector, anchor?, offset? }`), where it sticks by default. Resolves when the cursor arrives; `completed` is `false` when another move, the removal of the agent, or the deletion of the target interrupted it. A running action of the agent stops with `'agent-moved'`. Rejects when the agent is not added, for an invalid target, for an object that does not exist, and when an element target's object isn't mounted or has no visible element that matches the selector. See [Pointing at Elements](../advanced/agents.md#pointing-at-elements).

```ts
moveTo(target: KritzelAgenticTarget, options?: KritzelAgenticMoveOptions): Promise<KritzelAgenticMoveResult>
```

### detach

Releases the cursor from the object or element it sticks to. The cursor stays where it is, and the agent emits `detached` with `reason: 'manual'`.

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

Every action resolves with a [`KritzelAgenticActionResult`](#kritzelagenticactionresult) when it ends. `completed` is `false` with a `reason` when the action was refused or stopped. The promise rejects for an invalid action (`TypeError`) and when the agent is not added to an editor. An action that starts while a [`task()`](#task) runs belongs to that task: if it does not complete and the task is still running when it ends, it rejects with a [`KritzelAgentActionError`](#kritzelagentactionerror) instead.

Object IDs must belong to top-level objects. Every action takes [`KritzelAgenticActionOptions`](#kritzelagenticactionoptions) as its last argument.

### perform

Performs an action from an action object. All other action methods are shortcuts for it.

```ts
perform(action: KritzelAgenticAction, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### click

Presses at a point or an object anchor. Nothing changes; `objectIds` holds the object under the cursor, or is empty on a miss. `count: 2` plays a double press. With an element target (`{ objectId, selector }`), the element inside the object is really clicked, like [`interactWithElement(target, { type: 'click' })`](#interactwithelement).

```ts
click(
  target: KritzelAgenticPointTarget | KritzelAgenticObjectTarget | KritzelAgenticElementTarget,
  options?: { count?: 1 | 2 } & KritzelAgenticActionOptions,
): Promise<KritzelAgenticActionResult>
```

### interactWithElement

Uses an element inside an object's content as a user would, for example the play button of an iframe widget. The cursor flies to the element and presses while the content performs the [interaction](#kritzelobjectelementinteraction): a click, hover, fill, check, key press, or scroll. Before the cursor moves, the content scrolls the element into view and checks that it is visible, enabled, and not covered. On success, `objectIds` holds the object and `element` the element afterwards, with its state and value; the cursor stays on the element. When the element refuses, the result has `reason: 'element-interaction-failed'`, an [`elementReason`](#kritzelobjectelementinteractionfailurereason), and a `message`.

The interaction changes the content's own state, not the object, so it has no undo step. The object must be mounted, which it is while it is in or near the viewport. The object does not need to be selected.

```ts
interactWithElement(
  target: KritzelAgenticElementTarget,
  interaction: KritzelObjectElementInteraction,
  options?: KritzelAgenticActionOptions,
): Promise<KritzelAgenticActionResult>
```

```ts
const result = await agent.interactWithElement({ objectId: player.id, selector: '#play' }, { type: 'click' });
await agent.interactWithElement({ objectId: player.id, selector: '#volume' }, { type: 'fill', value: '80' });
```

The interaction is performed with DOM events, so the content's handlers run as for a real press. The events are not trusted (`isTrusted` is `false`) and carry no user activation, so browser APIs that need a user gesture may refuse to work from them, for example audio playback, fullscreen, or the clipboard.

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
moveObject(objectId: string, to: KritzelAgenticPointTarget | KritzelAgenticObjectTarget, options?: { align?: KritzelAgenticAnchor } & KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
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

### copyObjects

Duplicates objects like Alt-dragging them: the copies appear on the originals and are dragged so that their center lands on `to`, a point or an object anchor. Without `to`, they land right next to the originals. Group children and lines between copied objects are copied too, and a copied line lets go of objects that are not copied. The copies are stacked above all other objects and take the place of the originals in the agent's selection. `objectIds` holds the IDs of the copies, in stacking order.

```ts
copyObjects(
  objectIds: string[],
  options?: { to?: KritzelAgenticPointTarget | KritzelAgenticObjectTarget } & KritzelAgenticActionOptions,
): Promise<KritzelAgenticActionResult>
```

### groupObjects

Clicks the objects one after the other and groups them, like `group()` on the editor. The group becomes one layer at the position of the topmost object and takes the place of the objects in the agent's selection. Needs at least two objects. `objectIds` holds the ID of the group.

```ts
groupObjects(objectIds: string[], options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### ungroupObjects

Dissolves groups. Their children keep their place in the stacking order and take the place of the groups in the agent's selection. Resolves with `'invalid-target'` for an object that is not a group. `objectIds` holds the IDs of the children.

```ts
ungroupObjects(objectIds: string[], options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### orderObjects

Moves objects in the stacking order, like `bringToFront()`, `sendToBack()`, `bringForward()`, and `sendBackward()` on the editor. A group moves with its children.

```ts
orderObjects(objectIds: string[], order: 'front' | 'back' | 'forward' | 'backward', options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
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

Restyles objects; groups style their children. `style` needs at least one field. Fields apply where they make sense and are ignored elsewhere: `fillColor` to shapes; `strokeColor` and `strokeWidth` to shapes, strokes, and lines; `fontSize`, `fontFamily`, and `fontColor` to shapes and texts; `arrows` to lines, where an end that `arrows` leaves out keeps its arrow head; `opacity` to all objects.

```ts
setStyle(objectIds: string[], style: KritzelAgenticObjectStyle, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### updateIframe

Replaces parts of an iframe's code and its name; parts left out stay, and the iframe reloads with the new code. Works on iframes inside groups too. Resolves with `'invalid-target'` for objects that are not iframes.

```ts
updateIframe(objectId: string, changes: { name?: string; html?: string; css?: string; script?: string }, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

### addObject

Places an object that the app built, for example a `KritzelIframeObject`, as the agent's change: the cursor hops to the object and it appears, with the theme's appear animation (see [Object Appear](./theming.md#object-appear)). The object gets a new ID, which `objectIds` reports. Unlike the editor's `addObject()`, the user's selection and undo history stay untouched. Selections can't be added.

The object is not changed until the insert: the object and the children of a group get their new IDs and their z-index only then, on top of the objects on the canvas at that moment. An action that stops before the insert leaves the object as it was, so it can be added later. Resolves with `'invalid-target'` for an object that is already on the canvas, for a group with a child that is already on the canvas or that holds the same object twice, and for a group without children, either empty or with children that were inserted before.

```ts
addObject(object: KritzelBaseObject, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>
```

To show the object before its content is ready, perform the action with a `fill`, a promise of a [`KritzelAgenticFill`](#kritzelagenticfill): `perform({ type: 'addObject', object, fill })`. The object is placed as a [loading placeholder](./objects.md#loading-state), and the action stays open until `fill` resolves. Then `content` is prepared like an added object, so an image is fetched and stored, `apply` copies it onto the placeholder, and loading ends. Placing and filling are one step of the agent's history. See [Performing Actions](../advanced/agents.md#performing-actions) for an example.

- While the action waits, the placeholder is the user's: the user can move, resize, or delete it, and it is filled in where the user left it. These changes belong to the action's step, so stopping the action or undoing it removes the placeholder with them. Changes a collaborator makes meanwhile are not part of it.
- A rejected `fill` and a stopped action roll the whole action back and resolve with `'aborted'`. A deleted placeholder resolves with `'object-removed'`.
- The agent's later actions wait for this one, so resolve or reject `fill` without waiting for them.
- The action rejects with a `TypeError` when `fill` is not a promise or the object is a group.

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

Stops the running action, rolling its changes back, and drops the queued actions. They resolve with `reason: 'aborted'`. While a `task()` runs, every action that starts later resolves as aborted, and therefore throws, until the task returns.

```ts
cancel(): void
```

### task

Runs a script of actions as one task. `label` is shown as the status while the task runs, and the previous status comes back when it ends. The first action that does not complete throws a `KritzelAgentActionError` out of `fn`. An agent runs one task at a time; calling `task()` while another task of the agent is running rejects.

An action belongs to the task that runs when the action starts. Every action of the agent that starts while the task runs belongs to it, also one started outside `fn`, for example from a button. When it does not complete, its promise rejects with a `KritzelAgentActionError`. An action that started before the task, or that starts after the task has ended, resolves with its result and never throws.

```ts
task<T>(label: string, fn: () => Promise<T> | T): Promise<T>
```

---

## LLM Tools

Provider-neutral tool definitions and a canvas snapshot for LLMs. See [Connecting an LLM](../advanced/agents.md#connecting-an-llm) for a complete example with Claude, and [Chat Sessions](../advanced/chat-sessions.md) to connect the chat box without writing the tool loop.

### tools

Returns tool definitions for any LLM provider: `observe_canvas`, `inspect_elements`, and one tool per action. Hand `name`, `description`, and `inputSchema` to the model, and call `run(input, { signal })` with the model's input. Every call returns new tool objects. A tool keeps working when it is copied, as some tool runners do, and while the agent is not added, `run()` resolves with `reason: 'agent-removed'`.

```ts
tools(options?: KritzelAgentToolsOptions): KritzelAgentTool[]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| only | string[] | All tools | Only these tools, by name without `prefix`. |
| prefix | string | `''` | Put in front of every tool name, for example `'kritzel_'`, to avoid clashes with other tools. |
| maxTextLength | number | `2000` | Longest `text` that `create_shape`, `create_text`, or `type_text` may type. Longer input is rejected with `'invalid-input'`. |
| instant | boolean | `false` | Skips all animation in the actions of these tools: the changes appear at once. Placed objects still play the theme's appear animation. |
| iframes | boolean | `false` | Offers `create_iframe`, `read_iframe`, and `update_iframe`, which place, read, and change widgets of model-written code. |
| viewport | boolean | `true` | Offers `set_viewport` and `fit_viewport`, which pan and zoom the local user's view. |

| Tool | Runs | Input |
|------|------|-------|
| observe_canvas | [`observe()`](#observe) | `scope?` (`'all'` or `'viewport'`), `objectIds?` |
| inspect_elements | `queryElements()` of the object | `objectId`, `selector?`, `limit?` |
| click | [`click()`](#click) | `target`, `count?` |
| interact_with_element | [`interactWithElement()`](#interactwithelement) | `target` (`{ objectId, selector }`), `interaction` |
| select | [`select()`](#select) | `objectIds`, `additive?` |
| clear_selection | [`clearSelection()`](#clearselection) | — |
| move_object | [`moveObject()`](#moveobject) | `objectId`, `to`, `align?` |
| resize_object | [`resizeObject()`](#resizeobject) | `objectId`, `width?`, `height?`, `keepAspectRatio?`, `handle?` |
| rotate_object | [`rotateObject()`](#rotateobject) | `objectId`, `angle`, `relative?` |
| copy_objects | [`copyObjects()`](#copyobjects) | `objectIds`, `to?` |
| group_objects | [`groupObjects()`](#groupobjects) | `objectIds` |
| ungroup_objects | [`ungroupObjects()`](#ungroupobjects) | `objectIds` |
| order_objects | [`orderObjects()`](#orderobjects) | `objectIds`, `order` |
| create_shape | [`createShape()`](#createshape) | `x`, `y`, `width`, `height`, `shapeType?`, `text?`, `style?` |
| create_text | [`createText()`](#createtext) | `x`, `y`, `text`, `style?` |
| type_text | [`typeText()`](#typetext) | `objectId`, `text`, `mode?` |
| draw_path | [`drawPath()`](#drawpath) | `points`, `style?` |
| connect | [`connect()`](#connect) | `from`, `to`, `style?` |
| set_style | [`setStyle()`](#setstyle) | `objectIds`, `style` |
| delete_objects | [`deleteObjects()`](#deleteobjects) | `objectIds` |
| undo | [`undo()`](#undo) | — |
| redo | [`redo()`](#redo) | — |
| read_iframe | — | `objectId` |
| update_iframe | [`updateIframe()`](#updateiframe) | `objectId`, `name?`, `html?`, `css?`, `script?`, `edits?` |
| set_viewport | The engine's viewport | `x?`, `y?` (together), `zoom?` or `zoomBy?` |
| fit_viewport | The engine's viewport | `objectIds?` (all objects when left out), `maxZoom?` (default `1`) |

`addObject()` has no tool, because it needs an object that the app builds. A target (`target`, `to`) is one object in the schema: a point `{ x, y }` or a point on an object `{ objectId, anchor?, offset? }`, where `objectId` wins. The `click` tool clicks on the canvas only; models use widgets with `interact_with_element`, whose `interaction` is one object in the schema with a `type` and the fields of that type. Colors are CSS color strings.

`inspect_elements` lists the elements inside a widget (an object whose content has elements, such as an iframe object), so the model can find the selectors to use with `interact_with_element`. Without a `selector`, it lists the elements a user can interact with: buttons, links, form fields, elements with an interactive ARIA role, and elements that show a pointer cursor. It resolves with the `elements` as [`KritzelCanvasElement`](#kritzelcanvaselement) objects, at most `limit` (default 50, at most 200), and `truncated: true` when more matched. Both tools are offered to agents and to chat sessions that work as the user.

`run()` works as follows:

- It accepts the input as an object or as a JSON string, as some providers send it. `null` counts as a missing field. Unknown fields, missing required fields, and invalid values resolve with `reason: 'invalid-input'` and a `message` that names the field.
- An action tool runs [`perform()`](#perform) with the `signal` of the context. Calls that run in parallel queue up in call order, and `observe_canvas` waits until the queued actions of the agent are done, so its snapshot shows their result.
- An action tool resolves with a [`KritzelAgentToolResult`](#kritzelagenttoolresult) as JSON. On success, it has the `objectIds` of the action and, except for `click`, `select`, `clear_selection`, and `delete_objects`, the `objects` that were created or changed (up to 10). On failure, it has the `reason`, the `objectIds` that caused it, and a `hint` from [`AGENT_TOOL_REASON_HINTS`](#agent_tool_reason_hints). Inside [`task()`](#task), refusals are reported the same way instead of being thrown.
- `read_iframe` and `update_iframe` only work on widgets that `create_iframe` placed: iframes sandboxed to scripts only, with the content security policy of model-written code. Other iframes of your app resolve with `'not-allowed'`, so a model never puts code into an iframe that runs with more rights. `read_iframe` resolves with the widget's `name`, `html`, `css`, and `script`. `edits` of `update_iframe` are find-and-replace changes `{ part, find, replace }`, applied in order; each `find` must occur exactly once in its part, otherwise the call resolves with `'invalid-input'` and a `message` that says why.
- `set_viewport` and `fit_viewport` move only the view of the local user, never objects, and never the view of collaborators. They wait until the queued actions of the agent are done, so they can show what the same reply created, and resolve with `{ completed: true, viewport }`, the visible area as `observe_canvas` reports it. The zoom is clamped to the allowed range.
- `observe_canvas` resolves with a [`KritzelCanvasSnapshot`](#kritzelcanvassnapshot) as JSON. It uses the defaults of `observe()`; `maxTextLength` of `tools()` does not change them.
- It never rejects for mistakes of the model, only for unexpected errors.

`create_iframe` and `create_image` also have [`begin()`](#kritzelagenttool), which a runner that streams tool calls, such as a [chat session](../advanced/chat-sessions.md#placeholders-while-the-model-writes), calls while the model writes a call. They place a loading placeholder as soon as the position and size are written, `create_image` only with a `width` and `height`, and fill it in when the call finishes. Their schemas list the position and size before the content, because models write the fields in the order of the schema. Runners that don't stream tool calls only call `run()`.

### observe

Returns what the agent sees of the canvas: the visible area, the user's selection, the agent's cursor and selection, and the objects, back to front, with their geometry, text, connections, style, and creator. Coordinates are world units, rounded to one decimal. Image data, iframe content, the points of strokes, and hidden objects are left out. Rejects while the agent is not added and while no workspace is loaded.

```ts
observe(options?: KritzelObserveOptions): Promise<KritzelCanvasSnapshot>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| scope | `'all'` \| `'viewport'` | `'all'` | `'viewport'` keeps only the objects in the visible area. |
| objectIds | string[] | — | Only these objects and the children of these groups. |
| maxObjects | number | `100` | At most this many objects. Selected objects are kept first, then visible ones, then the ones nearest to the center of the viewport, and children only with their group. `truncated` is `true` when objects were left out. |
| maxTextLength | number | `300` | Longer texts are cut and end with "…". |

`busy` marks the objects whose actions would be refused: `'user'` when the user has the object selected or is editing it, `'collaborator'` when a collaborator is working on it, and `'agent'` when another agent, also one of a collaborator, has it selected or is working on it.

```ts
const snapshot = await agent.observe({ scope: 'viewport', maxObjects: 50 });

for (const object of snapshot.objects) {
  console.log(object.id, object.type, object.text ?? '', object.busy ?? 'free');
}
```

### formatAgentToolResult

Formats a result as the JSON string that the tools return. Use it in your own tools to answer the same way as the tools of the agent.

```ts
formatAgentToolResult(result: KritzelAgentToolResult): string
```

### parsePartialJson

Reads JSON text that may stop anywhere, such as the input of a tool call while the model writes it. Open objects and arrays are closed, and values that the text has not finished are left out: a string without its closing quote, a number that may go on, a half-written literal, and a key without its value. Returns `undefined` when the text holds no value yet or is not the start of valid JSON. Use it in the `update()` of a [begun tool call](#kritzelagenttool).

```ts
parsePartialJson(text: string): unknown
```

```ts
import { parsePartialJson } from '@kritzel/react-editor';

parsePartialJson('{"x":10,"y":2'); // { x: 10 }
parsePartialJson('{"x":10,"y":2,'); // { x: 10, y: 2 }
```

### AGENT_TOOL_REASON_HINTS

What a model should do about each failure reason, as used for the `hint` of tool results.

```ts
const AGENT_TOOL_REASON_HINTS: Record<KritzelAgenticActionFailureReason | 'invalid-input', string>;
```

```ts
import { AGENT_TOOL_REASON_HINTS, formatAgentToolResult } from '@kritzel/react-editor';

const result = await agent.addObject(page);
const json = formatAgentToolResult(result.reason ? { ...result, hint: AGENT_TOOL_REASON_HINTS[result.reason] } : result);
```

---

## Collaboration

When the editor shares presence with collaborators, it shares every agent whose [`broadcast`](#properties) is `true`, the default. See [Collaboration](../advanced/agents.md#collaboration) for a guide.

- **What is shared:** the name, color, avatar URL, status, visibility, running action and queue length, cursor position and attachment, presses, the agent's selection, and the objects of its running action. The agent's history and the agent object itself are not shared. A cursor that sticks to an element inside an object is shared by its position only, sent at most every 100 ms like other cursor motion: the editors of collaborators don't track the element, so there the cursor follows it only through these updates.
- **When:** only when something changed. Adding or removing the agent, renaming, recoloring, changing the avatar, hiding or showing it, and turning `broadcast` on or off are sent at once. The status, activity, selection, and cursor motion are sent at most every 100 ms. Each workspace has its own presence, so the agents are shared in the open workspace.
- **Limits:** the status is cut to 200 characters, and the selection and the objects of the running action to 50 IDs each.
- **Requirement:** a sync provider with awareness, such as the WebSocket and Hocuspocus providers, or `BroadcastSyncProvider.with({ awareness: true })` between tabs. Without one, nothing is shared. See [Providers](./providers.md).

The editors of collaborators show the agent's cursor, dashed outlines around its selection and the objects of its running action, and its avatar. They list it as a [`KritzelRemoteAgentPresence`](#kritzelremoteagentpresence) in `getRemoteAgents()` and `agentsChange`, but `getAgent()` does not return it there. Their agents refuse objects that it has selected or is working on with `'claimed-by-agent'`. An avatar URL from a collaborator is only used when it is an `http:`, `https:`, `data:image/`, or relative URL.

---

## Events

### on

Subscribes to an event of the agent and returns a function that unsubscribes. Errors thrown by a listener are logged and don't affect other listeners.

```ts
on<K extends keyof KritzelAgentEventMap>(event: K, listener: (payload: KritzelAgentEventMap[K]) => void): () => void
```

| Event | Payload Type | Description |
|-------|--------------|-------------|
| change | KritzelAgentState | The state changed: the agent was added or removed (`isAdded`), or its status, visibility, name, color, avatar, `broadcast`, activity, selection, history, or attachment changed. Also emitted for these changes while the agent is not added, and when a workspace switch drops the history (`canUndo` and `canRedo`). Not emitted for plain cursor motion. |
| detached | KritzelAgentDetachedEvent | The cursor stopped sticking to an object or an element inside it, because the object was deleted (`'object-removed'`) or after `detach()` (`'manual'`). |
| interrupted | KritzelAgentInterruptedEvent | Someone took over the objects of a running action: the user selected or grabbed them, a collaborator started editing them, or they were changed elsewhere. |
| removed | void | The agent was removed from its editor. |

The editor emits `agentsChange` with a [`KritzelAgentsChangeEvent`](#kritzelagentschangeevent) when agents are added or removed, or when their presence changes.

---

## Errors

### KritzelAgentActionError

Thrown when an action that belongs to a running [`task()`](#task) does not complete, for example because the user has the target selected. An action belongs to the task when it starts while the task runs.

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
import { KritzelAgentActionError } from '@kritzel/react-editor';

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
| `moveTo()` to an element of an object that is not mounted or has no content elements, or when no visible element matches the selector | Rejects with an `Error`. |
| `moveObject()` (also through `perform()`) with an element target (`selector`) | Rejects with a `TypeError`. Use `moveTo({ objectId, selector })` to point at an element. |
| `interactWithElement()`, or `click()` with an element target, with an empty selector or an invalid interaction | Rejects with a `TypeError`. |
| `task()` while another task of the agent is running | Rejects with an `Error`. |
| `observe()` while the agent is not added or no workspace is loaded | Rejects with an `Error`. |
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

An agent as reported by `toPresence()` and `agentsChange`. `displayName` and `profileImageUrl` repeat `name` and `avatarUrl` for components that render `IKritzelUser` objects. `isRemote` is always `false`. Agents of collaborators are [`KritzelRemoteAgentPresence`](#kritzelremoteagentpresence) objects with `isRemote: true`.

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
  isRemote: false;
}
```

### KritzelAgentsChangeEvent

Detail of the editor's `agentsChange` event. Emitted when agents are added or removed, or when their name, color, avatar, status, visibility, or activity changes, in this editor or in the editor of a collaborator. Never emitted for plain cursor motion. Lists the agents of this editor first, then the agents of collaborators. `isRemote` tells them apart: `if (agent.isRemote)` narrows an entry to a `KritzelRemoteAgentPresence`.

```ts
interface KritzelAgentsChangeEvent {
  agents: (KritzelAgentPresence | KritzelRemoteAgentPresence)[];
}
```

### KritzelRemoteAgentPresence

An agent of a collaborator, as returned by `getRemoteAgents()` and listed in `agentsChange` after the agents of the editor. The same agent ID can appear for several collaborators; `clientId` and `id` together are unique. In `agentsChange`, `if (agent.isRemote)` narrows an entry to this type. To filter the list, use a type predicate such as `(agent): agent is KritzelRemoteAgentPresence => agent.isRemote`.

```ts
interface KritzelRemoteAgentPresence extends Omit<KritzelAgentPresence, 'isRemote'> {
  isRemote: true;
  /** Awareness client ID of the collaborator's connection. */
  clientId: number;
  /** The collaborator whose editor runs the agent, when known. */
  hostUser?: { id: string; displayName?: string; color?: string };
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

A point in world coordinates, an anchor on an object, or an element inside an object's content, such as a button in an iframe object. Used by `moveTo()` and the `position` option, which point the cursor at an element, and by `click()` and `interactWithElement()`, which use it. `moveObject()` and `copyObjects()` take only point and object targets (`KritzelAgenticPointTarget | KritzelAgenticObjectTarget`). Anchors rotate with the object, and `offset` is in world units of the object's unrotated space. For an element target, the first element that matches `selector` is used, and `anchor` and `offset` are relative to the element's box. While the cursor sticks to an element, it follows the element inside the content; if the element disappears or is scrolled out of view, the cursor stays at its last visible position and returns once it reappears.

```ts
type KritzelAgenticTarget = KritzelAgenticPointTarget | KritzelAgenticObjectTarget | KritzelAgenticElementTarget;

interface KritzelAgenticPointTarget {
  x: number;
  y: number;
}

interface KritzelAgenticObjectTarget {
  objectId: string;
  anchor?: KritzelAgenticAnchor; // defaults to 'center'
  offset?: KritzelPoint;
}

// An element inside an object's content, such as a button in an iframe object
interface KritzelAgenticElementTarget {
  objectId: string;
  selector: string; // CSS selector, the first match is used
  anchor?: KritzelAgenticAnchor; // on the element, defaults to 'center'
  offset?: KritzelPoint;
}

type KritzelAgenticAnchor =
  | 'center' | 'top-left' | 'top' | 'top-right' | 'right'
  | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';

interface KritzelAgenticAttachment {
  objectId: string;
  selector?: string; // set when the cursor sticks to an element inside the object
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
  /** Whether the cursor sticks to an object or element target after arriving. Defaults to true. */
  attach?: boolean;
}

interface KritzelAgenticMoveResult {
  completed: boolean;
}

type KritzelEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);
```

### KritzelObjectElementInteraction

What [`interactWithElement()`](#interactwithelement) does to the element, as a user would with the mouse or keyboard. The content performs it with DOM events: its handlers run as for a real press, but CSS `:hover` and `:active` styles don't apply, and APIs that need a user gesture may refuse to work.

```ts
type KritzelObjectElementInteraction =
  /** Clicks the center of the element's visible part; count: 2 double-clicks. */
  | { type: 'click'; count?: 1 | 2 }
  /** Moves the pointer onto the element. */
  | { type: 'hover' }
  /** Replaces the value of a text field, textarea, or contenteditable element, sets a range, number, date, or color field,
   *  or selects the option of a select whose value or label matches. Fires input and change. */
  | { type: 'fill'; value: string }
  /** Checks or unchecks a checkbox, radio button, or switch by clicking it (or its label) if needed. */
  | { type: 'check'; checked?: boolean } // defaults to true
  /** Focuses the element and presses a key, e.g. 'Enter', 'Escape', 'ArrowUp', 'a', or 'Control+a'.
   *  Enter and Space activate buttons and links, arrow keys step range and number fields; no text is typed. */
  | { type: 'press'; key: string }
  /** Turns the mouse wheel over the element and scrolls it, or its closest scrollable ancestor, by CSS pixels. */
  | { type: 'scroll'; deltaX?: number; deltaY?: number };
```

### KritzelObjectElementInteractionFailureReason

Why an element refused an interaction: `elementReason` of an action result with `reason: 'element-interaction-failed'`, and `reason` of the result of the object's `interactWithElement()`.

| Reason | Meaning |
|--------|---------|
| `'not-found'` | No element matches the selector. |
| `'not-visible'` | The element is not rendered, hidden, or outside the content, also after scrolling it into view. |
| `'disabled'` | The element is disabled. |
| `'covered'` | Another element covers the point that would be clicked. |
| `'not-editable'` | `'fill'` on an element that is not a text field, select, or editable element, or that is read-only. |
| `'not-checkable'` | `'check'` on an element that is not a checkbox, radio button, or switch, or that did not change. |
| `'not-scrollable'` | `'scroll'` found nothing under the element that can scroll in that direction. |
| `'invalid-value'` | The value, option, or key was not accepted. A field that refused a value is left as it was. |
| `'unavailable'` | The object is not mounted, its content runs without scripts, or it did not respond or reloaded meanwhile. |

### KritzelObjectElementState

The `state` of an element in a [`KritzelCanvasElement`](#kritzelcanvaselement) and in element descriptions: what the element's attributes don't show. Only the fields that apply are set.

```ts
interface KritzelObjectElementState {
  disabled?: boolean;          // disabled, aria-disabled="true", or inside an inert subtree
  checked?: boolean | 'mixed'; // checkboxes, radio buttons, and switches, also by ARIA role
  selected?: boolean;          // <option>
  open?: boolean;              // <details>
  focused?: boolean;           // has the keyboard focus inside the content
  editable?: boolean;          // text fields, selects, and editable elements: whether they can be filled
  playing?: boolean;           // <audio> and <video>
}
```

### KritzelAgenticAction

Passed to `perform()`. Each action method builds one of these objects. Coordinates and sizes are in world units, angles in degrees.

```ts
type KritzelAgenticAction =
  | { type: 'click'; target: KritzelAgenticPointTarget | KritzelAgenticObjectTarget | KritzelAgenticElementTarget; count?: 1 | 2 }
  | { type: 'interactWithElement'; target: KritzelAgenticElementTarget; interaction: KritzelObjectElementInteraction }
  | { type: 'select'; objectIds: string[]; additive?: boolean }
  | { type: 'clearSelection' }
  | { type: 'moveObject'; objectId: string; to: KritzelAgenticPointTarget | KritzelAgenticObjectTarget; align?: KritzelAgenticAnchor }
  | { type: 'resizeObject'; objectId: string; width?: number; height?: number; keepAspectRatio?: boolean; handle?: KritzelAgenticResizeHandle }
  | { type: 'rotateObject'; objectId: string; angle: number; relative?: boolean }
  | { type: 'copyObjects'; objectIds: string[]; to?: KritzelAgenticPointTarget | KritzelAgenticObjectTarget }
  | { type: 'groupObjects'; objectIds: string[] }
  | { type: 'ungroupObjects'; objectIds: string[] }
  | { type: 'orderObjects'; objectIds: string[]; order: KritzelAgenticOrder }
  | { type: 'createShape'; x: number; y: number; width: number; height: number; shapeType?: ShapeType; text?: string; style?: KritzelAgenticShapeStyle }
  | { type: 'createText'; x: number; y: number; text: string; style?: KritzelAgenticTextStyle }
  | { type: 'typeText'; objectId: string; text: string; mode?: 'append' | 'replace' }
  | { type: 'drawPath'; points: KritzelPoint[]; style?: KritzelAgenticStrokeStyle }
  | { type: 'connect'; from: string; to: string; style?: KritzelAgenticLineStyle }
  | { type: 'setStyle'; objectIds: string[]; style: KritzelAgenticObjectStyle }
  | { type: 'addObject'; object: KritzelBaseObject; fill?: Promise<KritzelAgenticFill> }
  | { type: 'deleteObjects'; objectIds: string[] }
  | { type: 'undo' }
  | { type: 'redo' };

type KritzelAgenticActionType = KritzelAgenticAction['type'];

type KritzelAgenticResizeHandle = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

type KritzelAgenticOrder = 'front' | 'back' | 'forward' | 'backward';
```

Each member is also exported as its own interface, for example `KritzelAgenticMoveObjectAction`, `KritzelAgenticSetStyleAction`, and `KritzelAgenticAddObjectAction`.

### KritzelAgenticFill

What fills in the placeholder of an `addObject` action with a `fill`. See [addObject](#addobject).

```ts
interface KritzelAgenticFill {
  /** The object the placeholder stands in for. It is prepared like an added object, but never inserted. */
  content: KritzelBaseObject;
  /** Copies `content` onto the placeholder, for example a widget's code. Runs synchronously inside the action. */
  apply(placeholder: KritzelBaseObject, content: KritzelBaseObject): void;
}
```

`placeholder` is the object on the canvas, which the user may have moved or resized while the action waited. Copy only the content onto it, so that its position and size stay.

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
  /** Per end: an end left out keeps its arrow head. */
  arrows?: LineArrowConfig;
}
```

### KritzelAgenticActionOptions

The last argument of every action.

```ts
interface KritzelAgenticActionOptions {
  /** Screen pixels per second. Defaults to the agent's `speed`, or 1200. Also scales presses, drags, drawing, and typing. */
  speed?: number;
  /** Skips all animation and applies the change at once; a placed object still plays the theme's appear animation. Defaults to false. */
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
  /**
   * For interactions with elements: the element afterwards, or the element that refused the interaction,
   * as the object's content describes it (the content may be untrusted).
   */
  element?: KritzelObjectElementInfo;
  /** For 'element-interaction-failed': why the element refused the interaction. */
  elementReason?: KritzelObjectElementInteractionFailureReason;
  /** For 'element-interaction-failed': what went wrong, in words. */
  message?: string;
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
  | 'engine-disconnected'
  | 'element-interaction-failed';
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

### KritzelAgentTool

A tool definition returned by [`tools()`](#tools). Anthropic calls the schema `input_schema`, OpenAI calls it `parameters`.

```ts
interface KritzelAgentTool {
  name: string;
  description: string;
  inputSchema: KritzelAgentToolSchema;
  /** Runs the tool with the model's input (an object or a JSON string) and resolves with a JSON result. */
  run: (input: unknown, context?: KritzelAgentToolContext) => Promise<string>;
  /** Optional: begins a call while the model is still writing its input. */
  begin?: (context: KritzelAgentToolContext) => KritzelAgentToolCall;
}

interface KritzelAgentToolContext {
  /** Stops the action like the `signal` of an action. */
  signal?: AbortSignal | null;
  /** The ID of the tool call being run, when the runner has one. A chat session always passes it. */
  toolCallId?: string;
}

interface KritzelAgentToolCall {
  /** More input arrived: the input's JSON text written so far. */
  update(inputText: string): void;
  /** The input is complete: finishes the call and resolves with its result, exactly like `run()`. */
  finish(input: unknown): Promise<string>;
  /** The call won't run: undoes whatever the call began. A promise makes the runner wait until that is done. */
  cancel(): void | Promise<void>;
}
```

`begin()` is optional. A runner that streams tool calls, such as a [chat session](../advanced/chat-sessions.md#placeholders-while-the-model-writes), calls it when the model starts a call and gets a `KritzelAgentToolCall`. It passes the input written so far to `update()` as the input streams, then either calls `finish()` with the complete input instead of `run()`, or `cancel()` when the call won't run, for example because it was dropped or the prompt was stopped. A begun call is finished or cancelled exactly once. Runners that don't stream tool calls only call `run()`. `create_iframe` and `create_image` use `begin()` to show a loading placeholder while the model writes, and [`parsePartialJson()`](#parsepartialjson) reads the input written so far.

### KritzelAgentToolSchema

The JSON Schema of a tool's input. It uses only keywords that the major LLM providers accept: no `anyOf`, `const`, `$ref`, or minimum and maximum values. It is a type alias, not an interface, so that it fits SDK types that index schemas by string. The schemas are made for standard tool use, not for strict modes, so send the tools without strict mode: leave `strict` off with Anthropic and in OpenAI's Chat Completions API, and set `strict: false` in OpenAI's Responses API and Agents SDK. See [Other Providers](../advanced/agents.md#other-providers).

```ts
type KritzelAgentToolSchema = {
  type: 'object';
  description?: string;
  properties: Record<string, object>;
  required?: string[];
  additionalProperties?: false;
};
```

### KritzelAgentToolsOptions

Options of [`tools()`](#tools).

```ts
interface KritzelAgentToolsOptions {
  /** Only these tools (names without prefix), e.g. ['observe_canvas', 'create_shape']. */
  only?: string[];
  /** Prefix for every tool name, e.g. 'kritzel_'. */
  prefix?: string;
  /** Longest text an action may type. Defaults to 2000 characters. */
  maxTextLength?: number;
}
```

### KritzelAgentToolResult

What the `run()` of an action tool resolves with, as JSON. `formatAgentToolResult()` formats it.

```ts
interface KritzelAgentToolResult {
  completed: boolean;
  /** Why the action did not complete; 'invalid-input' when the input was rejected. */
  reason?: KritzelAgenticActionFailureReason | 'invalid-input';
  objectIds?: string[];
  /** What was wrong with the input, or why an element refused an interaction. */
  message?: string;
  /** What to do about the failure. */
  hint?: string;
  /** Snapshots of the objects the action created or changed. */
  objects?: KritzelCanvasObject[];
  /** The element an interaction acted on, as it is afterwards (interact_with_element). */
  element?: KritzelCanvasElement;
  /** The elements inside an object (inspect_elements). */
  elements?: KritzelCanvasElement[];
  /** Whether more elements matched than were returned. */
  truncated?: boolean;
}
```

### KritzelCanvasElement

An element inside an object's content as `inspect_elements` and `interact_with_element` describe it to models. Its strings come from the content, which may be untrusted.

```ts
interface KritzelCanvasElement {
  /** CSS selector of the element; pass it to interact_with_element. */
  selector: string;
  tagName: string;
  /** The element's text, truncated to 200 characters. */
  text?: string;
  classList?: string[];
  /** Descriptive attributes such as role, aria-*, type, placeholder, or title. */
  attributes?: Record<string, string>;
  /** State such as disabled, checked, or focused. */
  state?: KritzelObjectElementState;
  /** The value of a form field; never of password fields. */
  value?: string;
  /** Whether part of the element can be seen. */
  visible?: boolean;
}
```

### KritzelObserveOptions

Options of [`observe()`](#observe).

```ts
interface KritzelObserveOptions {
  /** 'all' (default) or only objects in the viewport. */
  scope?: 'all' | 'viewport';
  /** Only these objects (and their group children). */
  objectIds?: string[];
  /** At most this many objects (default 100); selected and visible objects are kept first. */
  maxObjects?: number;
  /** Longer texts are cut with "…" (default 300 characters). */
  maxTextLength?: number;
}
```

### KritzelCanvasSnapshot

Returned by [`observe()`](#observe) and by the `observe_canvas` tool.

```ts
interface KritzelCanvasSnapshot {
  /** The visible part of the canvas in world coordinates. */
  viewport: { x: number; y: number; width: number; height: number; scale: number };
  theme: string;
  /** Objects the user has selected. */
  userSelection: string[];
  agent: { id: string; position: KritzelPoint | null; selection: string[] };
  /** Back to front. */
  objects: KritzelCanvasObject[];
  /** Number of objects that matched, before `maxObjects`. */
  totalObjects: number;
  /** true when objects were left out because of `maxObjects`. */
  truncated?: true;
}
```

### KritzelCanvasObject

One object of a snapshot. Coordinates are world units, and the box is the box of the unrotated object. Colors are resolved for the current theme.

```ts
interface KritzelCanvasObject {
  id: string;
  type: 'shape' | 'text' | 'path' | 'line' | 'image' | 'iframe' | 'group' | 'custom' | 'object';
  shapeType?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees clockwise around the center; omitted when 0. */
  rotation?: number;
  text?: string;
  /** Set for children of a group: such objects are not top-level. */
  parentId?: string;
  childIds?: string[];
  /** For lines: the objects the ends are connected to. */
  from?: string;
  to?: string;
  style?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontColor?: string;
    opacity?: number;
    arrows?: { start?: string; end?: string };
  };
  /** Someone else is working on the object; actions on it will be refused. */
  busy?: 'user' | 'collaborator' | 'agent';
  /** Who created it: an agent ID, a user ID, or omitted. */
  createdBy?: string;
}
```
