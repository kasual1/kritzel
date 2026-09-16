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

## Import sources for event payload types

All common payload types are re-exported by `@kritzel/vue-editor`: `EditorIsReadyEvent`, `ObjectsAddedEvent`, `ObjectsRemovedEvent`, `ObjectsUpdatedEvent`, `ObjectsInViewportChangeEvent`, `KritzelViewportState`, `KritzelUndoState`, `KritzelEngineState`, `ThemeName`, plus the element types `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement`. Import them from `@kritzel/vue-editor`, not `@kritzel/engine` unless you are intentionally building against the engine package directly.

## Rules

- Treat `@isReady` / `@isEngineReady` as the start-of-life signal; sequence all seeding inside its handler. Handlers may be `async` — Vue binds them directly: `@isReady="onReady"`.
- Handlers may call back into the editor via `editor.value?.…` (e.g. re-query selection on `@objectsSelectionChange`).
- `getEditorRef('editor')` resolves the native `HTMLKritzelEditorElement` from the component instance; a raw template ref points at the Vue component, not the element. Use `getEngineRef` for `<KritzelEngine>`.
- Don't deep-store live `KritzelBaseObject` references in `ref()`s for long; store `id`s and re-fetch when acting later (objects can be replaced by sync/undo).
- There is no `v-model` / two-way binding. To set state, use props (e.g. `:theme` on the engine) backed by a `ref()`, and update that ref inside the matching change event (`@themeChange`).
