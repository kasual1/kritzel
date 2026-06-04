# Provider Pattern

## Location

`libs/kritzel-stencil/src/classes/providers/`

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
