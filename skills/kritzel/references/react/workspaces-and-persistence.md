# Workspaces, Persistence, Collaboration, Import/Export

## Workspaces

A workspace is a complete document: its objects, view state, and metadata. The editor always has one active workspace (one is created automatically on first run).

```tsx
import { KritzelWorkspace } from '@kritzel/react-editor';

const workspaces = await editor.getWorkspaces();
const active = await editor.getActiveWorkspace();

// Create — constructor takes (id, name)
const ws = new KritzelWorkspace(crypto.randomUUID(), 'Board 2');
await editor.createWorkspace(ws);

await editor.updateWorkspace(ws);        // rename etc. (mutate metadata, then update)
await editor.deleteWorkspace(ws);
```

### Switching workspaces (controlled pattern)

Drive the active workspace via the `activeWorkspaceId` prop backed by state, and mirror changes back from the event:

```tsx
const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(undefined);

<KritzelEditor
  activeWorkspaceId={activeWorkspaceId}
  onActiveWorkspaceChange={event => setActiveWorkspaceId(event.detail.id)}
  onIsReady={event => setActiveWorkspaceId(event.detail.activeWorkspace.id)}
/>
```

Your own workspace switcher buttons just call `setActiveWorkspaceId(ws.id)` — the prop change activates the workspace. The built-in workspace manager UI handles all of this; hide it with `isWorkspaceManagerVisible={false}` if you build your own.

## Persistence & sync providers

Kritzel state lives in a Yjs document; sync providers decide where it goes. **Default is `{ providers: [] }` — nothing persists across reloads.**

```tsx
import { useMemo } from 'react';
import { IndexedDBSyncProvider, type KritzelSyncConfig } from '@kritzel/react-editor';

const syncConfig = useMemo<KritzelSyncConfig>(
  () => ({ providers: [IndexedDBSyncProvider] }),   // local persistence, restored on reload
  [],
);

<KritzelEditor syncConfig={syncConfig} />
```

**Always memoize (or module-scope) `syncConfig`** — a new object every render churns the prop on the web component.

Available providers (all exported from `@kritzel/react-editor`):

| Provider | Persists/Syncs to | Use |
|---|---|---|
| `InMemorySyncProvider` | memory only | Explicit "no persistence" |
| `IndexedDBSyncProvider` | browser IndexedDB | Local persistence / offline |
| `BroadcastSyncProvider` | BroadcastChannel | Sync across tabs on the same device |
| `WebSocketSyncProvider.with({ url, roomName })` | y-websocket server | Real-time network sync |
| `HocuspocusSyncProvider.with({ url, name, token })` | Hocuspocus server | Real-time sync with auth; `token` may be a string or (async) function |

Providers are additive — combine for offline + realtime:

```tsx
const syncConfig = useMemo<KritzelSyncConfig>(() => ({
  providers: [
    IndexedDBSyncProvider,
    HocuspocusSyncProvider.with({ url: 'wss://collab.example.com', token: () => auth.getToken() }),
  ],
}), []);
```

If you change `syncConfig` after init (e.g. after login), call `await editor.reinitSync()` to tear down and reconnect.

## Collaboration extras

- Pass the current user for presence: `user={currentUser}` with `IKritzelUser` shape `{ id, displayName?, firstName?, lastName?, email?, profileImageUrl?, color?, isGuest? }`; show others via `activeUsers`. The editor treats `isGuest: true` (or no user) as logged out.
- Live remote cursors/presence arrive on `onAwarenessChange` → `Map<number, Record<string, any>>`.
- Shared/public workspaces: `await editor.loadSharedWorkspace(token)`; observe `onIsPublicChange`.
- Image/file binaries are stored via the `assetStorageConfig` prop; default is IndexedDB-backed. HTTP/presigned-URL providers exist for server storage.

## Import / Export

```tsx
// JSON round-trip
await editor.downloadAsJson('board.json');          // download file
await editor.importFromFile();                      // open file picker, import
const n = await editor.loadObjectsFromJson(json);   // merge objects into CURRENT workspace; returns count

// Engine-only granular APIs:
const json = await engine.exportAsJson();           // serialize active workspace
await engine.importFromJson(json);                  // import as a NEW workspace and switch to it

// Images
const dataUrl = await editor.getScreenshot('png'); // data URL or null
await editor.exportViewportAsPng();  // triggers download
await editor.exportViewportAsSvg();
```

## Rules

- Decide persistence **up front** via `syncConfig`; don't rely on the default (none).
- One IndexedDB namespace per `editorId` — distinct ids keep boards separate, a shared id makes two views of the same board.
- With persistence enabled, `onIsReady` fires with restored content — **guard seeding**: `if ((await editor.getAllObjects()).length === 0) await seed(editor);`.
- `loadObjectsFromJson` merges into the current workspace; `importFromJson` creates a new one. Pick deliberately.
- Treat tokens as functions (`token: () => Promise<string>`) so reconnects always get a fresh credential.
