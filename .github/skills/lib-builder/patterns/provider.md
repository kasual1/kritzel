# Provider Pattern

## Location

`libs/engine/core/src/classes/providers/`

Organized into:
- `assets/` — Asset storage/retrieval (images, files)
- `sync/` — Real-time collaboration backends

## Sync Providers

### Default Behavior

- `kritzel-editor` defaults to `syncConfig.providers = []`
- With no sync providers configured:
  - Object state is not persisted across page reloads
  - Object state is not persisted when switching to another workspace and coming back

### Persistence Scope Guide

| Goal | Recommended Provider | Persists Across Workspace Switches | Persists Across Page Reloads |
|------|-----------------------|------------------------------------|------------------------------|
| Deterministic demo state after reload | None (`providers: []`) | No | No |
| Real local persistence for product usage | `IndexedDBSyncProvider` | Yes | Yes |
| Demo-only workspace persistence in current session | `InMemorySyncProvider` | Yes | No |

### Demo Guidance

- Default for demos: do not configure a sync provider so each reload starts clean
- Exception: workspace concept demos should configure `InMemorySyncProvider` to demonstrate workspace switching while still resetting on reload

### Interface

All sync providers implement a common interface (`KritzelSyncProvider` or similar contract):

```typescript
interface SyncProvider {
  connect(): void | Promise<void>;
  disconnect(): void;
  destroy(): void;
}
```

### Existing Implementations

| Provider | Backend |
|----------|---------|
| `HocuspocusSyncProvider` | HocusPocus WebSocket server (Yjs) |
| `WebSocketSyncProvider` | Raw WebSocket |
| `BroadcastSyncProvider` | BroadcastChannel (same-origin tabs) |
| `IndexedDBSyncProvider` | Local IndexedDB persistence |
| `InMemorySyncProvider` | RAM only (testing/ephemeral) |

### Local vs Network Providers & the Loading Overlay

`ISyncProvider.type` is `'local'` or `'network'`. During `KritzelObjectMap.initialize()`:

- **Local** providers (IndexedDB, BroadcastChannel, InMemory) are **awaited** — their data is available synchronously once `initialize()` resolves.
- **Network** providers (Hocuspocus, WebSocket) connect in the **background** — `initialize()` does not block on them, and remote data arrives later via Yjs observers. Their `connect()` promises are bounded (they resolve on sync / reject on a ~10s timeout).

The workspace loading overlay is driven by `KritzelEngine._isWorkspaceLoading`. Because `core.initializeWorkspace()` resolves as soon as the local Y.Doc is ready, the overlay must **also** await `KritzelObjectMap.whenNetworkSynced()` — otherwise, for remote-hydrated workspaces, the overlay hides (or flashes past) before remote objects load.

Rules when touching this path:

- Keep network provider connection non-blocking in `KritzelObjectMap.initialize()`; expose completion via `whenNetworkSynced()` instead of awaiting inside `initialize()`.
- `whenNetworkSynced()` must resolve immediately when there are no network providers, and settle (not hang) even if a network provider fails/times out.
- When switching workspaces, only the **most recent** initialization may clear `_isWorkspaceLoading`, so a slow network sync from a previously-selected workspace can't hide the overlay for the current one. Capture the `store.objects` reference after init so a concurrent switch doesn't await the wrong map.

### Creating a New Sync Provider

```typescript
import { KritzelCore } from '../../core/core.class';

export class MySyncProvider {
  private readonly _core: KritzelCore;

  constructor(core: KritzelCore, config: MyProviderConfig) {
    this._core = core;
    // initialize connection
  }

  connect(): void {
    // establish connection, bind to Yjs doc
  }

  disconnect(): void {
    // graceful shutdown
  }

  destroy(): void {
    // cleanup all resources
  }
}
```

## Asset Providers

### Purpose

Resolve and store binary assets (images) referenced by objects on the canvas.

### Structure

- `asset-resolver.class.ts` — Main resolver that delegates to configured storage backend
- Storage backends configured via `KritzelAssetStorageConfig`

## Conventions

- File name: `<backend>-sync-provider.class.ts` or `<name>.class.ts`
- Providers receive `KritzelCore` + a typed config object
- Must handle connection lifecycle (connect, disconnect, destroy)
- Must be resilient to network failures (reconnect logic)
- Sync providers bind to the Yjs document from `this._core.store`
- Never block the main thread — use async where needed
