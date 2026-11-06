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
| `onObjectTitlebarAction` | `KritzelObjectTitlebarActionEvent` (`elementId`, `menuItemId?`, `section`, `objectId`, `objectType`, `workspaceId`, `anchorRect`) | A titlebar button is clicked or a titlebar menu item is selected (also on the engine) — in addition to the button's or menu item's own `action` |
| `onAgentsChange` | `KritzelAgentsChangeEvent` (`agents`: `KritzelAgentPresence[]` with `id`, `name`, `color`, `status`, `visible`, `activeAction`, `queueLength`) | Agents are added/removed (`addAgent` / `removeAgent`) or their name, color, avatar, status, visibility or activity changes (also on the engine), here or in a collaborator's editor. Lists local agents first, then collaborators' agents (`isRemote: true`). Never fires for plain cursor motion |

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
| `onObjectTitlebarMenuStateChange` | `KritzelObjectTitlebarMenuState` (`isVisible`, `objectId?`, `elementId?`, `section?`, `items`, `anchor?`, `anchorRect?`) | A titlebar `menu` opens or closes. Only needed without the editor (which renders titlebar menus itself and does not re-emit it): render `items` at `anchor`, then call `selectObjectTitlebarMenuItem(menuItemId)` / `closeObjectTitlebarMenu()` on the engine |

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

## Titlebar button and menu clicks

With an `objectTitlebar` configured (see theming-and-context-menus.md), every button click emits `onObjectTitlebarAction`. Identify the button by `elementId` and the object by `objectId`; `anchorRect` is the button's client rect for anchoring a popover. Selecting an item of a titlebar `menu` emits the same event with the menu's id as `elementId` and the menu item's id as `menuItemId`:

```tsx
async function onTitlebarAction(detail: KritzelObjectTitlebarActionEvent) {
  const object = await editorRef.current?.getObjectById(detail.objectId);
  setLastAction(`${detail.menuItemId ?? detail.elementId} · ${object?.name ?? detail.objectType}`);
}

<KritzelEditor
  ref={editorRef}
  objectTitlebar={objectTitlebar}
  onObjectTitlebarAction={event => void onTitlebarAction(event.detail)}
/>
```

## Agent events

A `KritzelAgent` (`new KritzelAgent({ name })`, added with `editor.addAgent(agent)` after the ready event) is a plain object, not an element, so its own events go through `agent.on(event, listener)`, which returns an unsubscribe function: `change` (`KritzelAgentState`: `status`, `visible`, `selection`, `activeAction`, `queueLength`, `canUndo`, `canRedo`, …; not emitted for plain cursor motion), `detached` (`{ objectId, reason: 'object-removed' | 'manual' }`), `interrupted` (`{ action, reason, objectIds, keptChanges }` — the user or a collaborator took over the objects of a running action) and `removed`. `agent.state` returns the current snapshot. Use the editor's `agentsChange` for a list of all agents.

```tsx
const [planner] = useState(() => new KritzelAgent({ id: 'planner', name: 'Planner', color: '#7C3AED' }));
const [plannerState, setPlannerState] = useState(() => planner.state);

useEffect(() => planner.on('change', setPlannerState), [planner]);
```

Create agents once (lazy `useState` or `useRef`) and add them in `onIsReady`; re-adding the same instance is a no-op, so StrictMode double calls are harmless.

**Collaborators.** With a sync provider that has awareness (WebSocket, Hocuspocus, or `BroadcastSyncProvider.with({ awareness: true })` between tabs), every agent with `broadcast: true` (the default) is shared as presence: collaborators see its cursor, selection outlines and avatar. Their agents are never `KritzelAgent` objects in this editor (`getAgent()` returns `null` for them); read them with `await editorRef.current?.getRemoteAgents()` (`KritzelRemoteAgentPresence[]`) or from `onAgentsChange`, which lists local agents first, then remote ones (`isRemote: true`, `clientId`, `hostUser?`; narrow with `(agent): agent is KritzelRemoteAgentPresence => agent.isRemote`). `broadcast: false` (or setting `agent.broadcast` later) keeps an agent local. Local agents refuse objects that a collaborator's agent has selected or is working on with `'claimed-by-agent'`; people are never blocked. The editor's avatar stack shows local and remote agents after `activeUsers` (`isAgentAvatarsVisible`, default `true`).

**LLMs.** `agent.tools({ only?, prefix?, maxTextLength? })` returns provider-neutral tools (`KritzelAgentTool`: `name`, `description`, `inputSchema` JSON Schema, `run(input, { signal })` → `Promise<string>` of JSON). Map `inputSchema` to Anthropic's `input_schema` (or OpenAI's `parameters`), run each `tool_use` block with `tool.run(block.input, { signal })` and send the strings back as `tool_result`s until `stop_reason !== 'tool_use'`. `run()` never throws for model mistakes: they come back as `completed: false` with `reason` and `hint`. `agent.observe({ scope?, objectIds?, maxObjects?, maxTextLength? })` returns a `KritzelCanvasSnapshot` (viewport, user selection, objects with geometry, text, style and `busy`). App-defined tools (e.g. one that calls `agent.addObject()`) answer with `formatAgentToolResult()` and `AGENT_TOOL_REASON_HINTS`. Calling an LLM API from the browser exposes the API key: route requests through a backend.

## Import sources for event payload types

`ObjectsAddedEvent`, `ObjectsUpdatedEvent` and `ObjectsRemovedEvent` carry an optional `source` (`KritzelAgentChangeSource`: `{ type: 'agent', agentId, actionType }`) when a `KritzelAgent` made the change — through an action such as `agent.moveObject()`, or through the agent's own `agent.undo()` / `agent.redo()` (`actionType` `'undo'` / `'redo'`). It is absent for user, collaborator and sync changes and for the user's undo/redo. Objects an agent creates have `userId === agent.id`.

All common payload types are re-exported by `@kritzel/react-editor`: `EditorIsReadyEvent`, `ActiveWorkspaceChangeEvent`, `ObjectsAddedEvent`, `ObjectsRemovedEvent`, `ObjectsUpdatedEvent`, `ObjectsInViewportChangeEvent`, `KritzelViewportState`, `KritzelUndoState`, `KritzelEngineState`, `KritzelDebugInfo`, `IKritzelUser`, `LoginEvent`, `ThemeName`, `KritzelObjectTitlebarActionEvent`, `KritzelObjectTitlebarMenuState`, `KritzelAgentsChangeEvent`, `KritzelAgentPresence`, `KritzelRemoteAgentPresence`, `KritzelAgentState`, `KritzelAgentChangeSource`, `KritzelAgentTool`, `KritzelCanvasSnapshot`, plus the element types `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement`. The `KritzelAgent` class, `KritzelAgentActionError`, `formatAgentToolResult` and `AGENT_TOOL_REASON_HINTS` come from the same package. Import them from `@kritzel/react-editor`, not `@kritzel/engine` unless you are intentionally building against the engine package directly.

## Rules

- Treat `onIsReady` / `onIsEngineReady` as the start-of-life signal; sequence all seeding inside its handler. Async handlers from JSX: `onIsReady={() => void onReady()}`.
- Handlers may be async and call back into the editor (e.g. re-query selection on `onObjectsSelectionChange`).
- Don't deep-store live `KritzelBaseObject` references in state for long; store `id`s and re-fetch when acting later (objects can be replaced by sync/undo).
- There is no two-way binding. To set state, use props (`theme`, `activeWorkspaceId`) backed by `useState`, and update that state inside the matching change event (`onThemeChange`, `onActiveWorkspaceChange`).
