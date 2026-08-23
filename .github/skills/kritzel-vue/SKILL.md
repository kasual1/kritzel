---
name: kritzel-vue
description: Build infinite-canvas experiences in Vue with the Kritzel library (KritzelEditor / KritzelEngine web components). Use when adding, configuring, or programmatically driving a Kritzel canvas in a Vue app — creating objects, controlling the viewport, registering tools, theming, workspaces, persistence, or collaboration.
---

# Kritzel in Vue

Kritzel is an infinite-canvas drawing library built with Stencil, consumed in Vue 3 through the `kritzel-vue` wrapper package. It ships two components:

- **`<KritzelEditor>`** — the full experience: canvas + toolbar, workspace manager, settings, context menus, export dialogs. **Default choice.**
- **`<KritzelEngine>`** — the headless canvas only. No UI, **no tools registered by default**. Use when you build your own UI around the canvas.

## Golden rules (always apply)

1. **Setup is just an import.** `import { KritzelEditor } from 'kritzel-vue'` and render it in the template. No plugin, no `app.use`, no manual `defineCustomElements` — the wrapper registers the custom elements lazily on first render.
2. **The host element needs explicit size.** `style="display: block; width: 100%; height: 100vh"` (or `flex: 1; min-height: 0; display: block` inside a flex column). Without it nothing renders.
3. **Wait for readiness before any method call.** Bind `@isReady` on `<KritzelEditor>` (or `@isEngineReady` on `<KritzelEngine>`) and only call API methods after it fires. Calling earlier fails.
4. **Every API method is async.** Always `await` calls; never fire-and-forget when order matters. `@click` handlers may be `async` functions directly.
5. **Get the element via the `getEditorRef` composable, not a raw template ref.** A template ref on `<KritzelEditor>` points at the Vue component instance, not the DOM element. Bind `ref="editor"` in the template and resolve with `const editor = getEditorRef('editor')` (argument = the template-ref *name*; call at the top level of `<script setup>`). It returns a computed ref to the native `HTMLKritzelEditorElement` — call all methods through it: `await editor.value?.addObject(...)`. Use `getEngineRef` for `<KritzelEngine>`. Both composables and the element types are exported from `kritzel-vue`.
6. **Events are camelCase `@` bindings carrying `CustomEvent<T>`; the payload is always `event.detail`.** Handlers receive a plain `Event` — cast: `(event as CustomEvent<KritzelBaseObject[]>).detail`.
7. **Define object/array props as consts in `<script setup>`.** `toolbar`, `syncConfig`, `themes`, `globalContextMenuItems`, `objectContextMenuItems`, etc. are assigned to the web component by reference — inline object literals in the template are recreated on every render and re-trigger the component's prop setters. Bind with `:toolbar="toolbar"`; bind numbers/booleans with `:` too (`:isPanningEnabled="false" :isZoomingEnabled="false"`).
8. **Create objects with constructors, position with `translateX`/`translateY` (world coordinates), insert with `addObject`/`addObjects`.** Use `addObjects` for batches (single transaction).
9. **Never mutate an object and expect a re-render.** Change objects through `await editor.value.updateObject(obj, { ...partial })`.
10. **Colors are theme-aware objects, not strings:** `{ light: '#1f2937', dark: '#f3f4f6' }`.
11. **Camera vs. object:** `setViewport`/`panTo`/`zoomTo` move the *camera*; `centerObjectInViewport` and object updates move *objects*. To focus something without relocating it, use `setViewport(obj.centerX, obj.centerY, scale)`.
12. **Convert pointer coordinates with `screenToWorld(x, y)`** before placing objects at a clicked position (subtract the editor's bounding rect from `clientX`/`clientY` first if the editor doesn't fill the page).
13. **Discriminate object types via `obj.__class__`** (`'KritzelPath' | 'KritzelText' | 'KritzelShape' | 'KritzelLine' | 'KritzelImage' | 'KritzelGroup'`), e.g. in `findObjects(predicate)`.
14. **Kritzel state lives in the engine, not in Vue.** Mirror what your UI needs into `ref()`s from Kritzel events; drive changes through element methods or controlled props (`theme`, `:activeWorkspaceId`) — there is no `v-model`/two-way binding.
15. **Give every instance a unique `editorId`** when more than one editor can exist (namespaces localStorage/IndexedDB keys).
16. **No persistence by default.** State is lost on reload unless you pass `:syncConfig` with providers (e.g. `IndexedDBSyncProvider`).

## Minimal working component

```vue
<script setup lang="ts">
import { KritzelEditor, KritzelText, getEditorRef } from 'kritzel-vue'

const editor = getEditorRef('editor')

async function onReady() {
  const text = new KritzelText({
    text: 'Hello Kritzel!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontColor: { light: '#000000', dark: '#ffffff' },
  })
  await editor.value?.addObject(text)
}
</script>

<template>
  <KritzelEditor
    ref="editor"
    editorId="my-canvas"
    @isReady="onReady"
    style="display: block; width: 100%; height: 100vh"
  />
</template>
```

## Reference files (read on demand)

| File | Read when you need… |
|---|---|
| [references/setup.md](references/setup.md) | Installation, sizing, editor vs. engine choice, headless engine setup, `getEditorRef`/`getEngineRef`, prop stability, multi-instance |
| [references/objects.md](references/objects.md) | Creating/updating/removing/querying objects of every type, selection, grouping, z-order, clipboard |
| [references/viewport.md](references/viewport.md) | Pan/zoom, coordinate conversion, boundaries, fitting content, scale limits |
| [references/tools-and-toolbar.md](references/tools-and-toolbar.md) | Switching tools, registering custom/preconfigured tools, customizing the toolbar `toolbar` array |
| [references/events.md](references/events.md) | Every event of editor & engine and the Vue binding/state patterns |
| [references/workspaces-and-persistence.md](references/workspaces-and-persistence.md) | Workspaces, sync providers (IndexedDB/WebSocket/Hocuspocus), collaboration, import/export, screenshots |
| [references/theming-and-context-menus.md](references/theming-and-context-menus.md) | Custom themes, theme-aware colors, global/object context menus |
| [references/recipes.md](references/recipes.md) | End-to-end patterns: image annotation, pin maps, read-only galleries, slide decks, object explorers |
