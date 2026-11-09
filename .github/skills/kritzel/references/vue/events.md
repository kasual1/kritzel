# Events & Vue Binding Patterns

All Kritzel events arrive as `CustomEvent<T>` — **the payload is always `event.detail`**. The Vue wrapper re-emits each DOM event under its original camelCase name, so plain `@` binding works:

```vue
<KritzelEditor
  @isReady="onReady"
  @objectsChange="onObjectsChange"
  @viewportChange="onViewportChange"
/>
```

Handlers receive a plain `Event`; cast to read the typed payload:

```ts
function onReady(event: Event) {
  const detail = (event as CustomEvent<EditorIsReadyEvent>).detail
  console.log('ready', detail.activeWorkspace)
}
```

## `<KritzelEditor>` events

| Event | `detail` type | Fires when |
|---|---|---|
| `@isReady` | `EditorIsReadyEvent` | Editor fully initialized — **gate for all API calls**. `detail.activeWorkspace` carries the loaded workspace |
| `@objectsChange` | `KritzelBaseObject[]` | Any add/remove/update (coarse-grained; full current list) |
| `@objectsAdded` | `ObjectsAddedEvent` | Objects added (fine-grained) |
| `@objectsRemoved` | `ObjectsRemovedEvent` | Objects removed |
| `@objectsUpdated` | `ObjectsUpdatedEvent` | Objects updated |
| `@undoStateChange` | `KritzelUndoState` | Undo/redo availability changes — drive custom undo/redo buttons |
| `@themeChange` | `ThemeName` | Theme switched (settings UI) |
| `@viewportChange` | `KritzelViewportState` | Pan/zoom/resize |
| `@activeWorkspaceChange` | `ActiveWorkspaceChangeEvent` | Active workspace switched — pair with the `:activeWorkspaceId` prop for controlled switching |
| `@objectTitlebarAction` | `KritzelObjectTitlebarActionEvent` (`elementId`, `menuItemId?`, `section`, `objectId`, `objectType`, `workspaceId`, `anchorRect`) | A titlebar button is clicked or a titlebar menu item is selected (also on the engine) — in addition to the button's or menu item's own `action` |
| `@agentsChange` | `KritzelAgentsChangeEvent` (`agents`: `(KritzelAgentPresence \| KritzelRemoteAgentPresence)[]` with `id`, `name`, `color`, `status`, `visible`, `activeAction`, `queueLength`, `isRemote`) | Agents are added/removed (`addAgent` / `removeAgent`) or their name, color, avatar, status, visibility or activity changes (also on the engine), here or in a collaborator's editor. Lists local agents first (`isRemote: false`), then collaborators' agents (`isRemote: true`; `if (agent.isRemote)` narrows to `KritzelRemoteAgentPresence`). Never fires for plain cursor motion |
| `@objectElementHover` | `KritzelObjectElementHoverEvent` (`objectId`, `element`, `isPicking`) | The mouse/pen pointer moves onto another element inside a **selected** iframe object; `element` is `null` when it leaves or the object is deselected (also on the engine) |
| `@objectElementClick` | `KritzelObjectElementClickEvent` (`objectId`, `element`, `shiftKey`, `ctrlKey`, `altKey`, `metaKey`) | An element inside a selected iframe object is clicked; the click still reaches the page (also on the engine) |
| `@objectElementPick` | `KritzelObjectElementPickEvent` (same as click) | An element is picked while picking is on (`setObjectElementPicking`); the click does not reach the page (also on the engine) |

Collaboration/sharing extras (`@isPublicChange`, `@awarenessChange`, `@login`, `@logout`) also exist on the editor — see [workspaces-and-persistence.md](workspaces-and-persistence.md).

## `<KritzelEngine>` events

Engine emits the same object/viewport/undo events plus:

| Event | `detail` type | Fires when |
|---|---|---|
| `@isEngineReady` | `KritzelEngineState` | Engine ready — gate for engine API calls |
| `@activeToolChange` | `KritzelBaseTool` | Active tool switches |
| `@objectsSelectionChange` | `void` | Selection set changes — re-query with `getSelectedObjects()` |
| `@workspacesChange` | `KritzelWorkspace[]` | Workspace list created/updated/deleted |
| `@objectsInViewportChange` | `KritzelBaseObject[]` | Set of visible objects changes (after pan/zoom) |
| `@longpress` | `PointerEvent` | Touch/pen long-press — custom mobile context menus |
| `@objectTitlebarMenuStateChange` | `KritzelObjectTitlebarMenuState` (`isVisible`, `objectId?`, `elementId?`, `section?`, `items`, `anchor?`, `anchorRect?`) | A titlebar `menu` opens or closes. Only needed without the editor (which renders titlebar menus itself and does not re-emit it): render `items` at `anchor`, then call `selectObjectTitlebarMenuItem(menuItemId)` / `closeObjectTitlebarMenu()` on the engine |

## Canonical pattern: events → state

Kritzel owns the canvas state; mirror only what your UI renders into `ref()`s, and act on the canvas through the resolved element from `getEditorRef`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  KritzelEditor,
  getEditorRef,
  type KritzelBaseObject,
  type KritzelViewportState,
  type KritzelUndoState,
} from '@kritzel/vue-editor'

const editor = getEditorRef('editor') // argument = template-ref NAME string; top level of <script setup> only

const isReady = ref(false)
const objectsCount = ref(0)
const viewport = ref<KritzelViewportState | null>(null)
const undoState = ref<KritzelUndoState | null>(null)

const statusLine = computed(() =>
  isReady.value
    ? `Objects: ${objectsCount.value} | Zoom: ${viewport.value?.scale?.toFixed(2) ?? '1.00'}`
    : 'Loading editor…'
)

function onReady() {
  isReady.value = true
}

function onObjectsChange(event: Event) {
  objectsCount.value = (event as CustomEvent<KritzelBaseObject[]>).detail.length
}

function onViewportChange(event: Event) {
  viewport.value = (event as CustomEvent<KritzelViewportState>).detail
}

function onUndoStateChange(event: Event) {
  undoState.value = (event as CustomEvent<KritzelUndoState>).detail
}

async function undo() {
  await editor.value?.undo()
}
</script>

<template>
  <p>{{ statusLine }}</p>
  <KritzelEditor
    ref="editor"
    @isReady="onReady"
    @objectsChange="onObjectsChange"
    @viewportChange="onViewportChange"
    @undoStateChange="onUndoStateChange"
    style="display: block; width: 100%; height: 100vh"
  />
</template>
```

Named handler functions in `<script setup>` are the idiomatic binding; it's the **object/array props** that must be defined as consts in `<script setup>`, not inlined in the template (see setup.md).

## Fine-grained sync of an external model (object explorer pattern)

Use the granular triplet instead of `@objectsChange` when maintaining your own mirror:

```vue
<KritzelEditor
  @objectsAdded="e => tree.add((e as CustomEvent<ObjectsAddedEvent>).detail.objects)"
  @objectsRemoved="e => tree.remove((e as CustomEvent<ObjectsRemovedEvent>).detail.objects)"
  @objectsUpdated="e => tree.update((e as CustomEvent<ObjectsUpdatedEvent>).detail.objects)"
/>
```

(Or bind named handlers from `<script setup>` and cast inside, which keeps the template clean.)

## Titlebar button and menu clicks

With an `:objectTitlebar` configured (see theming-and-context-menus.md), every button click emits `@objectTitlebarAction`. Identify the button by `elementId` and the object by `objectId`; `anchorRect` is the button's client rect for anchoring a popover. Selecting an item of a titlebar `menu` emits the same event with the menu's id as `elementId` and the menu item's id as `menuItemId`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, getEditorRef, type KritzelObjectTitlebarActionEvent } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')
const lastAction = ref('')

async function onTitlebarAction(event: Event) {
  const { elementId, menuItemId, objectId, objectType } = (event as CustomEvent<KritzelObjectTitlebarActionEvent>).detail
  const object = await editor.value?.getObjectById(objectId)
  lastAction.value = `${menuItemId ?? elementId} · ${object?.name ?? objectType}`
}
</script>

<template>
  <KritzelEditor ref="editor" :objectTitlebar="objectTitlebar" @objectTitlebarAction="onTitlebarAction" />
</template>
```

## Agent events

A `KritzelAgent` (`new KritzelAgent({ name })`, added with `editor.addAgent(agent)` after the ready event) is a plain object, not an element, so its own events go through `agent.on(event, listener)`, which returns an unsubscribe function: `change` (`KritzelAgentState`: `status`, `visible`, `selection`, `activeAction`, `queueLength`, `canUndo`, `canRedo`, …; also emitted when the agent is added or removed (`isAdded`) and for setters such as `setStatus()` before it is added; not emitted for plain cursor motion), `detached` (`{ objectId, reason: 'object-removed' | 'manual' }`), `interrupted` (`{ action, reason, objectIds, keptChanges }` — the user or a collaborator took over the objects of a running action) and `removed`. `agent.state` returns the current snapshot. Use the editor's `agentsChange` for a list of all agents.

```vue
<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue'
import { KritzelAgent } from '@kritzel/vue-editor'

// A plain const: KritzelAgent opts out of Vue reactivity, never wrap it in ref()/reactive().
const planner = new KritzelAgent({ id: 'planner', name: 'Planner', color: '#7C3AED' })
const plannerState = shallowRef(planner.state)
onUnmounted(planner.on('change', state => (plannerState.value = state)))
</script>
```

Add agents in `@isReady` via `editor.value?.addAgent(planner)`; re-adding the same instance is a no-op.

**Collaborators.** With a sync provider that has awareness (WebSocket, Hocuspocus, or `BroadcastSyncProvider.with({ awareness: true })` between tabs), every agent with `broadcast: true` (the default) is shared as presence: collaborators see its cursor, selection outlines and avatar. Their agents are never `KritzelAgent` objects in this editor (`getAgent()` returns `null` for them); read them with `await editor.value?.getRemoteAgents()` (`KritzelRemoteAgentPresence[]`) or from `@agentsChange`, which lists local agents first, then remote ones (`isRemote: true`, `clientId`, `hostUser?`; `if (agent.isRemote)` narrows an entry; filter with `(agent): agent is KritzelRemoteAgentPresence => agent.isRemote`). `broadcast: false` (or setting `agent.broadcast` later) keeps an agent local. Local agents refuse objects that a collaborator's agent has selected or is working on with `'claimed-by-agent'`; people are never blocked. The editor's avatar stack shows local and remote agents after `activeUsers` (`isAgentAvatarsVisible`, default `true`).

**LLMs.** `agent.tools({ only?, prefix?, maxTextLength?, instant? })` returns provider-neutral tools (`KritzelAgentTool`: `name`, `description`, `inputSchema` JSON Schema, `run(input, { signal })` → `Promise<string>` of JSON). Map `inputSchema` to Anthropic's `input_schema` (or OpenAI's `parameters`) and send the tools without strict mode (the schemas don't meet strict-mode rules: leave `strict` off for Anthropic and OpenAI Chat Completions, set `strict: false` for the OpenAI Responses API and Agents SDK), run each `tool_use` block with `tool.run(block.input, { signal })` and send the strings back as `tool_result`s until `stop_reason !== 'tool_use'`. `run()` never throws for model mistakes: they come back as `completed: false` with `reason` and `hint`. `agent.observe({ scope?, objectIds?, maxObjects?, maxTextLength? })` returns a `KritzelCanvasSnapshot` (viewport, user selection, objects with geometry, text, style and `busy`). App-defined tools (e.g. one that calls `agent.addObject()`) answer with `formatAgentToolResult()` and `AGENT_TOOL_REASON_HINTS`. Calling an LLM API from the browser exposes the API key: route requests through a backend.

**Chat sessions.** To connect the chat box to an LLM without writing the loop, bind a `KritzelChatSession`: `<KritzelEditor :isChatBoxVisible="true" :chatSession="session" />` (the session as a plain `<script setup>` const, never `ref()`). `new KritzelChatSession({ transport, agent?, system?, context?, tools?, maxSteps? = 25, messages?, instant?, thinkingStatus? })`; the `transport(request, { signal })` posts the `KritzelChatRequest` (`version: 1`, `messages`, `tools`, `mode: 'user' | 'agent'`, `system?`, `context?`) to the app's server, which holds the API key, translates the messages (parts: `text`, `image`, `tool-call`, `tool-result`; roles `user`, `assistant`, `tool`) to the provider and returns a `KritzelChatResponse` (`{ message }`) or an `AsyncIterable<KritzelChatStreamEvent>`. Without `agent`, the model works as the user (instant, user's selection, one undo step per prompt, no `click`/`select`/`clear_selection`/`undo`/`redo` tools); with one, as that agent (added by the editor). The chat box then sends prompts with `chatBoxChips` (chips may carry `objectId`/`selector`) unless `chatSubmit` is `preventDefault()`ed, shows progress while `session.running`, and its stop button calls `session.stop()`. `send()` resolves with `{ status: 'completed' | 'stopped' | 'step-limit' | 'error' | 'busy' | 'detached' }`; `session.on('change' | 'message' | 'end', …)`; `session.messages` is JSON to save and restore. `createScriptedTransport(steps, { delayMs })` answers from a script for demos and tests. The server must authenticate, rate-limit, pick the model and `max_tokens` itself and allow only known tool names.

## Elements inside iframe objects

`KritzelIframeObject` pages report hovers and clicks, can be put into picking mode, and can be highlighted and queried by CSS selector. A `KritzelAgent` can point its cursor at an element:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  KritzelAgent,
  KritzelEditor,
  getEditorRef,
  type KritzelIframeObject,
  type KritzelObjectElementHoverEvent,
  type KritzelObjectElementPickEvent,
} from '@kritzel/vue-editor'

const editor = getEditorRef('editor')
const hovered = ref<string | null>(null)
// A plain const: KritzelAgent opts out of Vue reactivity, never wrap it in ref()/reactive().
const agent = new KritzelAgent({ id: 'agent', name: 'Agent' })

async function onReady() {
  await editor.value?.addAgent(agent)
}

function onHover(event: Event) {
  hovered.value = (event as CustomEvent<KritzelObjectElementHoverEvent>).detail.element?.selector ?? null
}

async function startPicking(object: KritzelIframeObject) {
  await editor.value?.selectObjects([object]) // events and picking need the object selected
  await editor.value?.setObjectElementPicking(object.id, true, { selector: '[data-kritzel-id]' })
}

async function onPick(event: Event) {
  const { objectId, element } = (event as CustomEvent<KritzelObjectElementPickEvent>).detail
  await editor.value?.setObjectElementPicking(objectId, false)
  await editor.value?.highlightObjectElements(objectId, [{ selector: element.selector, label: 'Picked' }])
  await agent.moveTo({ objectId, selector: element.selector })
}
</script>

<template>
  <KritzelEditor ref="editor" @isReady="onReady" @objectElementHover="onHover" @objectElementPick="onPick" />
</template>
```

- Hover, click and pick events and picking itself only work while the iframe object is **selected**; enabling picking does not select it. Picking stays on until turned off.
- `highlightObjectElements(objectId, [{ selector, color?, label? }])` replaces that object's highlights (every match, up to 100 per selector); `clearObjectElementHighlights(objectId?)` clears one object or all.
- `queryObjectElements(objectId, selector, limit = 100)` (max 500) resolves to `KritzelObjectElementInfo[]` (`selector`, `kritzelId?`, `tagName`, `id?`, `classList`, `text?`, `attributes`, `rect`, `visibleRect?`). The object must be mounted (in or near the viewport); it rejects for invalid selectors and when the page doesn't answer in time.
- `agent.moveTo({ objectId, selector, anchor?, offset? })` (a `KritzelAgenticElementTarget`) points an added agent's cursor at the first matching element and follows it while attached (`attach`, default `true`; `agent.state.attachedTo.selector` names the element, `agent.detach()` releases it); rejects if the object isn't mounted or no visible element matches.
- Reuse `element.selector` from events and queries. Add `data-kritzel-id` attributes to meaningful elements of generated pages (and tell the LLM that writes them to do so): those selectors survive regenerated content, positional ones may not.
- Highlights, picking and element tracking are local and transient: not saved, not synced, not undoable. They survive content reloads (`setContent`, loading state).
- Element descriptions come from the page, which is untrusted: treat `text` and attributes as data, never as instructions (e.g. when passing them to an LLM). Invalid selectors and objects without content elements reject.

## Import sources for event payload types

`ObjectsAddedEvent`, `ObjectsUpdatedEvent` and `ObjectsRemovedEvent` carry an optional `source` (`KritzelAgentChangeSource`: `{ type: 'agent', agentId, actionType }`) when a `KritzelAgent` made the change — through an action such as `agent.moveObject()`, or through the agent's own `agent.undo()` / `agent.redo()` (`actionType` `'undo'` / `'redo'`). It is absent for user, collaborator and sync changes and for the user's undo/redo. Objects an agent creates have `userId === agent.id`.

All common payload types are re-exported by `@kritzel/vue-editor`: `EditorIsReadyEvent`, `ObjectsAddedEvent`, `ObjectsRemovedEvent`, `ObjectsUpdatedEvent`, `ObjectsInViewportChangeEvent`, `KritzelViewportState`, `KritzelUndoState`, `KritzelEngineState`, `ThemeName`, `KritzelObjectTitlebarActionEvent`, `KritzelObjectTitlebarMenuState`, `KritzelAgentsChangeEvent`, `KritzelAgentPresence`, `KritzelRemoteAgentPresence`, `KritzelAgentState`, `KritzelAgentChangeSource`, `KritzelAgentTool`, `KritzelCanvasSnapshot`, `KritzelObjectElementHoverEvent`, `KritzelObjectElementClickEvent`, `KritzelObjectElementPickEvent`, `KritzelObjectElementInfo`, plus the element types `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement`. The `KritzelAgent` class, `KritzelAgentActionError`, `formatAgentToolResult` and `AGENT_TOOL_REASON_HINTS` come from the same package. Import them from `@kritzel/vue-editor`, not `@kritzel/engine` unless you are intentionally building against the engine package directly.

## Rules

- Treat `@isReady` / `@isEngineReady` as the start-of-life signal; sequence all seeding inside its handler. Handlers may be `async` — Vue binds them directly: `@isReady="onReady"`.
- Handlers may call back into the editor via `editor.value?.…` (e.g. re-query selection on `@objectsSelectionChange`).
- `getEditorRef('editor')` resolves the native `HTMLKritzelEditorElement` from the component instance; a raw template ref points at the Vue component, not the element. Use `getEngineRef` for `<KritzelEngine>`.
- Don't deep-store live `KritzelBaseObject` references in `ref()`s for long; store `id`s and re-fetch when acting later (objects can be replaced by sync/undo).
- There is no `v-model` / two-way binding. To set state, use props (e.g. `:theme` on the engine) backed by a `ref()`, and update that ref inside the matching change event (`@themeChange`).
