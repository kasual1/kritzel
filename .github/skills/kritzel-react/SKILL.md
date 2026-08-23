---
name: kritzel-react
description: Build infinite-canvas experiences in React with the Kritzel library (KritzelEditor / KritzelEngine web components). Use when adding, configuring, or programmatically driving a Kritzel canvas in a React app — creating objects, controlling the viewport, registering tools, theming, workspaces, persistence, or collaboration.
---

# Kritzel in React

Kritzel is an infinite-canvas drawing library built with Stencil, consumed in React through the `kritzel-react` wrapper package. It ships two components:

- **`<KritzelEditor>`** — the full experience: canvas + toolbar, workspace manager, settings, context menus, export dialogs. **Default choice.**
- **`<KritzelEngine>`** — the headless canvas only. No UI, **no tools registered by default**. Use when you build your own UI around the canvas.

## Golden rules (always apply)

1. **Setup is just an import.** `import { KritzelEditor } from 'kritzel-react'` and render it. No provider, no plugin, no manual `defineCustomElements` — the wrapper registers the custom elements lazily on first render.
2. **The host element needs explicit size.** `style={{ display: 'block', width: '100%', height: '100vh' }}` (or `flex: 1, minHeight: 0, display: 'block'` inside a flex column). Without it nothing renders.
3. **Wait for readiness before any method call.** Pass `onIsReady` to `<KritzelEditor>` (or `onIsEngineReady` to `<KritzelEngine>`) and only call API methods after it fires. Calling earlier fails.
4. **Every API method is async.** Always `await` calls; never fire-and-forget when order matters. From JSX handlers, wrap: `onClick={() => void doAsync()}`.
5. **Get the element via a ref:** `const editorRef = useRef<HTMLKritzelEditorElement | null>(null)` + `ref={editorRef}`. The ref *is* the underlying custom element — call all methods directly on it (`await editorRef.current.addObject(...)`). `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement` are exported from `kritzel-react`.
6. **Events are `on`-prefixed props carrying `CustomEvent<T>`; the payload is always `event.detail`.** E.g. `onObjectsChange={e => setCount(e.detail.length)}`.
7. **Stabilize object/array props.** `toolbar`, `syncConfig`, `themes`, `globalContextMenuItems`, `objectContextMenuItems`, etc. are assigned to the web component by reference — define them at module scope or memoize with `useMemo(() => ..., [])`. A fresh object per render re-triggers the component's prop setters. Inside memoized callbacks, reach the editor through `editorRef.current?.` (refs are identity-stable).
8. **Create objects with constructors, position with `translateX`/`translateY` (world coordinates), insert with `addObject`/`addObjects`.** Use `addObjects` for batches (single transaction).
9. **Never mutate an object and expect a re-render.** Change objects through `await editor.updateObject(obj, { ...partial })`.
10. **Colors are theme-aware objects, not strings:** `{ light: '#1f2937', dark: '#f3f4f6' }`.
11. **Camera vs. object:** `setViewport`/`panTo`/`zoomTo` move the *camera*; `centerObjectInViewport` and object updates move *objects*. To focus something without relocating it, use `setViewport(obj.centerX, obj.centerY, scale)`.
12. **Convert pointer coordinates with `screenToWorld(x, y)`** before placing objects at a clicked position.
13. **Discriminate object types via `obj.__class__`** (`'KritzelPath' | 'KritzelText' | 'KritzelShape' | 'KritzelLine' | 'KritzelImage' | 'KritzelGroup'`), e.g. in `findObjects(predicate)`.
14. **Kritzel state lives in the engine, not in React.** Mirror what your UI needs into `useState` from Kritzel events; drive changes through ref methods or controlled props (`theme`, `activeWorkspaceId`) — there is no two-way binding.
15. **Give every instance a unique `editorId`** when more than one editor can exist (namespaces localStorage/IndexedDB keys).
16. **No persistence by default.** State is lost on reload unless you pass `syncConfig` with providers (e.g. `IndexedDBSyncProvider`).

## Minimal working component

```tsx
import { useRef, useState } from 'react';
import { KritzelEditor, KritzelText, type HTMLKritzelEditorElement } from 'kritzel-react';

export function Canvas() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;
    setIsReady(true);

    const text = new KritzelText({
      text: 'Hello Kritzel!',
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontColor: { light: '#000000', dark: '#ffffff' },
    });
    await editor.addObject(text);
  }

  return (
    <KritzelEditor
      ref={editorRef}
      editorId="my-canvas"
      onIsReady={() => void onReady()}
      style={{ display: 'block', width: '100%', height: '100vh' }}
    />
  );
}
```

## Reference files (read on demand)

| File | Read when you need… |
|---|---|
| [references/setup.md](references/setup.md) | Installation, sizing, editor vs. engine choice, headless engine setup, prop stability, multi-instance, SSR |
| [references/objects.md](references/objects.md) | Creating/updating/removing/querying objects of every type, selection, grouping, z-order, clipboard |
| [references/viewport.md](references/viewport.md) | Pan/zoom, coordinate conversion, boundaries, fitting content, scale limits |
| [references/tools-and-toolbar.md](references/tools-and-toolbar.md) | Switching tools, registering custom/preconfigured tools, customizing the toolbar `toolbarItems` array |
| [references/events.md](references/events.md) | Every event of editor & engine and the React prop/state patterns |
| [references/workspaces-and-persistence.md](references/workspaces-and-persistence.md) | Workspaces, sync providers (IndexedDB/WebSocket/Hocuspocus), collaboration, import/export, screenshots |
| [references/theming-and-context-menus.md](references/theming-and-context-menus.md) | Custom themes, theme-aware colors, global/object context menus |
| [references/recipes.md](references/recipes.md) | End-to-end patterns: image annotation, pin maps, read-only galleries, slide decks, object explorers |
