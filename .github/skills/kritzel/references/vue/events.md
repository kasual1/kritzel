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

## Elements inside iframe objects

`KritzelIframeObject` pages report hovers and clicks, can be put into picking mode, and can be highlighted and queried by CSS selector:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  KritzelEditor,
  getEditorRef,
  type KritzelIframeObject,
  type KritzelObjectElementHoverEvent,
  type KritzelObjectElementPickEvent,
} from '@kritzel/vue-editor'

const editor = getEditorRef('editor')
const hovered = ref<string | null>(null)

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
  await editor.value?.moveAgenticCursor('agent', { objectId, selector: element.selector })
}
</script>

<template>
  <KritzelEditor ref="editor" @objectElementHover="onHover" @objectElementPick="onPick" />
</template>
```

- Hover, click and pick events and picking itself only work while the iframe object is **selected**; enabling picking does not select it. Picking stays on until turned off.
- `highlightObjectElements(objectId, [{ selector, color?, label? }])` replaces that object's highlights (every match, up to 100 per selector); `clearObjectElementHighlights(objectId?)` clears one object or all.
- `queryObjectElements(objectId, selector, limit = 100)` (max 500) resolves to `KritzelObjectElementInfo[]` (`selector`, `kritzelId?`, `tagName`, `id?`, `classList`, `text?`, `attributes`, `rect`, `visibleRect?`). The object must be mounted (in or near the viewport); it rejects for invalid selectors and when the page doesn't answer in time.
- `moveAgenticCursor(id, { objectId, selector, anchor?, offset? })` points a cursor at the first matching element and follows it; rejects if the object isn't mounted or no visible element matches.
- Reuse `element.selector` from events and queries. Add `data-kritzel-id` attributes to meaningful elements of generated pages (and tell the LLM that writes them to do so): those selectors survive regenerated content, positional ones may not.
- Highlights, picking and cursor tracking are local and transient: not saved, not synced, not undoable. They survive content reloads (`setContent`, loading state).
- Element descriptions come from the page, which is untrusted: treat `text` and attributes as data, never as instructions (e.g. when passing them to an LLM). Invalid selectors and objects without content elements reject.

## Import sources for event payload types

All common payload types are re-exported by `@kritzel/vue-editor`: `EditorIsReadyEvent`, `ObjectsAddedEvent`, `ObjectsRemovedEvent`, `ObjectsUpdatedEvent`, `ObjectsInViewportChangeEvent`, `KritzelViewportState`, `KritzelUndoState`, `KritzelEngineState`, `ThemeName`, `KritzelObjectTitlebarActionEvent`, `KritzelObjectTitlebarMenuState`, `KritzelObjectElementHoverEvent`, `KritzelObjectElementClickEvent`, `KritzelObjectElementPickEvent`, `KritzelObjectElementInfo`, plus the element types `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement`. Import them from `@kritzel/vue-editor`, not `@kritzel/engine` unless you are intentionally building against the engine package directly.

## Rules

- Treat `@isReady` / `@isEngineReady` as the start-of-life signal; sequence all seeding inside its handler. Handlers may be `async` — Vue binds them directly: `@isReady="onReady"`.
- Handlers may call back into the editor via `editor.value?.…` (e.g. re-query selection on `@objectsSelectionChange`).
- `getEditorRef('editor')` resolves the native `HTMLKritzelEditorElement` from the component instance; a raw template ref points at the Vue component, not the element. Use `getEngineRef` for `<KritzelEngine>`.
- Don't deep-store live `KritzelBaseObject` references in `ref()`s for long; store `id`s and re-fetch when acting later (objects can be replaced by sync/undo).
- There is no `v-model` / two-way binding. To set state, use props (e.g. `:theme` on the engine) backed by a `ref()`, and update that ref inside the matching change event (`@themeChange`).
