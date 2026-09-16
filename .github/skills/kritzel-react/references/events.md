# Events & React Binding Patterns

All Kritzel events arrive as `CustomEvent<T>` — **the payload is always `event.detail`**. The React wrapper exposes each DOM event as an `on`-prefixed prop, so plain JSX binding works:

```tsx
<KritzelEditor
  onIsReady={() => void onReady()}
  onObjectsChange={event => setObjectsCount(event.detail.length)}
  onViewportChange={event => setViewport(event.detail)}
/>
```

Handlers are typed as receiving `KritzelEditorCustomEvent<T>` (a `CustomEvent` subtype). If TypeScript infers a plain `Event`, cast: `(event as CustomEvent<KritzelBaseObject[]>).detail`.

## `<KritzelEditor>` event props

| Prop | `detail` type | Fires when |
|---|---|---|
| `onIsReady` | `EditorIsReadyEvent` | Editor fully initialized — **gate for all API calls**. Contains `host`, `activeWorkspace`, `syncConfig`, `assetStorageConfig`, `loginConfig`, `theme` |
| `onActiveWorkspaceChange` | `ActiveWorkspaceChangeEvent` (`id`, `name`, `isPublic`, `createdAt`, `updatedAt`) | Active workspace switches |
| `onObjectsChange` | `KritzelBaseObject[]` | Any add/remove/update (coarse-grained; full current list) |
| `onObjectsAdded` | `ObjectsAddedEvent` | Objects added (fine-grained) |
| `onObjectsRemoved` | `ObjectsRemovedEvent` | Objects removed |
| `onObjectsUpdated` | `ObjectsUpdatedEvent` | Objects updated |
| `onUndoStateChange` | `KritzelUndoState` | Undo/redo availability changes — drive custom undo/redo buttons |
| `onThemeChange` | `ThemeName` | Theme switched (settings UI or `theme` prop) |
| `onViewportChange` | `KritzelViewportState` | Pan/zoom/resize |
| `onIsPublicChange` | `IKritzelIsPublicChangeEvent` | Share-state of active workspace toggles |
| `onAwarenessChange` | `Map<number, Record<string, any>>` | Remote collaborator presence/cursors update |
| `onLogin` / `onLogout` | `LoginEvent` / `void` | Login dialog interactions (only with `loginConfig`) |

## `<KritzelEngine>` event props

Engine emits the same object/viewport/undo/awareness events plus:

| Prop | `detail` type | Fires when |
|---|---|---|
| `onIsEngineReady` | `KritzelEngineState` | Engine ready — gate for engine API calls |
| `onActiveToolChange` | `KritzelBaseTool` | Active tool switches |
| `onObjectsSelectionChange` | `void` | Selection set changes — re-query with `getSelectedObjects()` |
| `onWorkspacesChange` | `KritzelWorkspace[]` | Workspace list created/updated/deleted |
| `onActiveWorkspaceChange` | `KritzelWorkspace` | Active workspace switches (full object, unlike editor) |
| `onObjectsInViewportChange` | `ObjectsInViewportChangeEvent` | Set of visible objects changes |
| `onLongpress` | `PointerEvent` | Touch/pen long-press — custom mobile context menus |

## Canonical pattern: events → state

Kritzel owns the canvas state; mirror only what your UI renders into `useState`, and act on the canvas through the ref:

```tsx
export function Demo() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [objectsCount, setObjectsCount] = useState(0);
  const [viewport, setViewport] = useState<KritzelViewportState | null>(null);
  const [undoState, setUndoState] = useState<KritzelUndoState | null>(null);

  const statusLine = isReady
    ? `Objects: ${objectsCount} | Zoom: ${viewport?.scale?.toFixed(2) ?? '1.00'}`
    : 'Loading editor…';

  return (
    <>
      <p>{statusLine}</p>
      <KritzelEditor
        ref={editorRef}
        editorId="demo"
        onIsReady={() => setIsReady(true)}
        onObjectsChange={event => setObjectsCount(event.detail.length)}
        onViewportChange={event => setViewport(event.detail)}
        onUndoStateChange={event => setUndoState(event.detail)}
        style={{ display: 'block', width: '100%', height: '100vh' }}
      />
    </>
  );
}
```

Inline arrow handlers are fine here — function props are detached/re-attached cheaply; it's the **object/array props** that must be identity-stable (see setup.md).

## Fine-grained sync of an external model (object explorer pattern)

Use the granular triplet instead of `onObjectsChange` when maintaining your own mirror:

```tsx
<KritzelEditor
  onObjectsAdded={event => tree.add(event.detail.objects)}
  onObjectsRemoved={event => tree.remove(event.detail.objects)}
  onObjectsUpdated={event => tree.update(event.detail.objects)}
/>
```

## Import sources for event payload types

All common payload types are re-exported by `@kritzel/react-editor`: `EditorIsReadyEvent`, `ActiveWorkspaceChangeEvent`, `ObjectsAddedEvent`, `ObjectsRemovedEvent`, `ObjectsUpdatedEvent`, `ObjectsInViewportChangeEvent`, `KritzelViewportState`, `KritzelUndoState`, `KritzelEngineState`, `KritzelDebugInfo`, `IKritzelUser`, `LoginEvent`, `ThemeName`, plus the element types `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement`. Import them from `@kritzel/react-editor`, not `@kritzel/engine` unless you are intentionally building against the engine package directly.

## Rules

- Treat `onIsReady` / `onIsEngineReady` as the start-of-life signal; sequence all seeding inside its handler. Async handlers from JSX: `onIsReady={() => void onReady()}`.
- Handlers may be async and call back into the editor (e.g. re-query selection on `onObjectsSelectionChange`).
- Don't deep-store live `KritzelBaseObject` references in state for long; store `id`s and re-fetch when acting later (objects can be replaced by sync/undo).
- There is no two-way binding. To set state, use props (`theme`, `activeWorkspaceId`) backed by `useState`, and update that state inside the matching change event (`onThemeChange`, `onActiveWorkspaceChange`).
