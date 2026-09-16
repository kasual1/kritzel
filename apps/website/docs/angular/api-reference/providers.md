---
sidebar_label: Providers
title: "Providers | Kritzel for Angular"
description: "Reference for all sync provider classes and configuration interfaces in Kritzel: in-memory, IndexedDB, BroadcastChannel, WebSocket, and Hocuspocus."
toc_max_heading_level: 2
---
# Providers

This is the API reference for all sync providers in Kritzel.
A sync provider connects a Kritzel document to a storage or transport medium — browser storage, other tabs, or a collaboration server — and is registered through the editor's `syncConfig` prop.

## Overview

Kritzel stores canvas state in [Yjs](https://docs.yjs.dev/) documents. Every provider in `syncConfig.providers` is attached to those documents and keeps them in sync with its medium. Providers are additive: multiple providers can be active on the same document at once.

| Provider | Type | Persistence scope | Requires a server |
|----------|------|-------------------|-------------------|
| InMemorySyncProvider | local | Current page session (lost on reload) | No |
| IndexedDBSyncProvider | local | Durable, per browser profile and device | No |
| BroadcastSyncProvider | local | None (live relay between tabs) | No |
| WebSocketSyncProvider | network | Server-side | Yes |
| HocuspocusSyncProvider | network | Server-side | Yes |

Each configured provider is instantiated once per Yjs document:

- once for the app-state document (`kritzel-app-state-{editorId}-{appStateId}`) which holds the workspace list
- once for every workspace document (`kritzel-workspace-{editorId}-{workspaceId}`) which holds the canvas objects

The generated document name is passed to the provider as `docName`.

---

## Sync Config

`KritzelSyncConfig` is the object passed to the editor's `syncConfig` prop. The default value is `{ providers: [] }`, which means no state is persisted or shared.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| providers | ProviderConfig[] | Provider classes or factories to attach to every Kritzel document |
| appStateId | string | Shared identifier for the app-state document. When omitted, a browser-local persisted instance id is used, which is stable across reloads but not shared across devices |

```ts
import { IndexedDBSyncProvider, KritzelSyncConfig } from '@kritzel/angular-editor';

syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
};
```

---

## Sync Provider Interface

`ISyncProvider` is the contract every provider implements. Implement it directly to add a custom synchronization medium.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| type | SyncProviderType | `'local'` for providers that resolve without a network, `'network'` for server-backed providers |
| awareness | Awareness \| null | Yjs awareness instance used for presence. Network providers expose one, local providers return `null` or `undefined` |

`type` controls initialization behavior: local providers are awaited during startup so their data is available immediately, while network providers connect in the background so a slow or unreachable server never blocks the editor.

### Methods

#### connect

Initializes the provider and resolves once the initial sync has completed.

```ts
connect(): Promise<void>
```

#### disconnect

Disconnects the provider while keeping it reusable.

```ts
disconnect(): void
```

#### reconnect

Disconnects and connects again. Used to recover from stale connections after a network change or tab restore.

```ts
reconnect(): Promise<void>
```

#### destroy

Destroys the provider and releases all of its resources.

```ts
destroy(): void
```

---

## Provider Config

`ProviderConfig` is what an entry in `syncConfig.providers` accepts — either a provider class or a `ProviderFactory`.

```ts
type ProviderConfig =
  | (new (docName: string, doc: Y.Doc, options?: any) => ISyncProvider)
  | ProviderFactory;
```

A `ProviderFactory` carries the provider `type` and a `create` method, and is produced by the static `with` method on providers that accept options.

```ts
interface ProviderFactory {
  readonly type?: SyncProviderType;
  create(docName: string, doc: Y.Doc, options?: { quiet?: boolean }): ISyncProvider;
}
```

---

## In-Memory Provider

`InMemorySyncProvider` keeps document state in a module-scoped cache. State survives the editor being removed from and re-added to the DOM within the same page session, but is lost on reload. It is intended for demos and tests where durable storage is undesirable.

### Options

`InMemoryOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| name | string | `docName` | Cache key used for the document |

### Methods

#### clear

Clears the in-memory cache. Removes a single entry when a cache key is given, otherwise all entries.

```ts
static clear(name?: string): void
```

```ts
import { InMemorySyncProvider, KritzelSyncConfig } from '@kritzel/angular-editor';

syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
};
```

---

## IndexedDB Provider

`IndexedDBSyncProvider` persists document state in the browser's IndexedDB via [y-indexeddb](https://github.com/yjs/y-indexeddb). State survives reloads and browser restarts on the same device and browser profile.

### Options

`IndexedDBOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| name | string | `docName` | Database name used for the document |

`connect` resolves once the persisted state has been loaded into the document. `disconnect` is a no-op because IndexedDB has no connection to close.

```ts
import { IndexedDBSyncProvider, KritzelSyncConfig } from '@kritzel/angular-editor';

syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
};
```

---

## Broadcast Provider

`BroadcastSyncProvider` mirrors document updates between browser tabs of the same origin using the [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel). It stores nothing itself and is normally combined with a persisting provider.

The channel name is the `docName`, so the same document is shared across tabs automatically. The provider takes no options.

```ts
import { BroadcastSyncProvider, IndexedDBSyncProvider, KritzelSyncConfig } from '@kritzel/angular-editor';

syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider, BroadcastSyncProvider],
};
```

---

## WebSocket Provider

`WebSocketSyncProvider` connects to any [y-websocket](https://github.com/yjs/y-websocket)-compatible server for real-time collaboration. It exposes an `awareness` instance, so remote cursors and active users become available.

### Options

`WebSocketOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | `ws://localhost:1234` | WebSocket server URL |
| roomName | string | `docName` | Room the document joins on the server |
| params | Record&lt;string, string&gt; | – | Query parameters appended to the connection URL |
| protocols | string[] | – | WebSocket subprotocols |
| WebSocketPolyfill | any | – | Custom WebSocket constructor for non-browser environments |
| awareness | any | – | Custom awareness instance |
| maxBackoffTime | number | – | Upper bound for the reconnect backoff delay |
| quiet | boolean | `false` | Suppresses console output |

`connect` rejects after 10 seconds if the server does not accept the connection. Because network providers are connected in the background, this does not block editor startup.

### Methods

#### with

Creates a `ProviderFactory` bound to the given options.

```ts
static with(options?: WebSocketOptions): ProviderFactory
```

```ts
import { IndexedDBSyncProvider, KritzelSyncConfig, WebSocketSyncProvider } from '@kritzel/angular-editor';

syncConfig: KritzelSyncConfig = {
  providers: [
    IndexedDBSyncProvider,
    WebSocketSyncProvider.with({ url: 'wss://sync.example.com' }),
  ],
};
```

:::warning
Setting `roomName` forces every Kritzel document — the app state and all workspaces — into a single room. Leave it unset so each document keeps its generated `docName`.
:::

---

## Hocuspocus Provider

`HocuspocusSyncProvider` connects to a [Hocuspocus](https://tiptap.dev/hocuspocus) server. Compared to the WebSocket provider it adds authentication tokens, configurable reconnect behavior, lifecycle callbacks, and connection multiplexing. It reconnects automatically when the tab becomes visible again or the browser goes back online.

### Options

`HocuspocusOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | `ws://localhost:1234` | Hocuspocus server URL |
| name | string | `docName` | Document name on the server |
| token | string \| (() =&gt; string) \| (() =&gt; Promise&lt;string&gt;) | – | Authentication token, resolved lazily when a function is given |
| websocketProvider | HocuspocusProviderWebsocket | – | Shared socket to multiplex over instead of opening a dedicated connection |
| connectionTimeout | number | `10000` | Timeout in ms for the initial `connect` call. The provider keeps reconnecting in the background even after it fires |
| delay | number | `1000` | Base delay in ms between reconnect attempts |
| factor | number | `2` | Exponential backoff multiplier for the reconnect delay |
| maxAttempts | number | `0` | Maximum reconnect attempts, `0` means unlimited |
| minDelay | number | – | Lower bound for the reconnect delay in ms |
| maxDelay | number | – | Upper bound for the reconnect delay in ms |
| forceSyncInterval | false \| number | – | Interval in ms for forced sync round-trips |
| WebSocketPolyfill | any | – | Custom WebSocket constructor for non-browser environments |
| quiet | boolean | `false` | Suppresses console output |
| onConnect | () =&gt; void | – | Called on every connection, including reconnections |
| onDisconnect | () =&gt; void | – | Called when the connection drops |
| onSynced | () =&gt; void | – | Called when the document has finished syncing |
| onStatus | (data: &#123; status: string &#125;) =&gt; void | – | Called on every connection status change |
| onAuthenticationFailed | (data: any) =&gt; void | – | Called when the server rejects the token |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| connectionStatus | ConnectionStatus | Current status: `'disconnected'`, `'connecting'`, `'connected'`, or `'synced'` |
| awareness | Awareness \| null | Awareness instance used for presence and remote cursors |

### Methods

#### with

Creates a `ProviderFactory` bound to the given options.

```ts
static with(options?: HocuspocusOptions): ProviderFactory
```

#### createSharedWebSocket

Creates a shared WebSocket connection that all subsequently created Hocuspocus providers multiplex over. Returns the existing instance if one was already created.

```ts
static createSharedWebSocket(options: HocuspocusWebSocketOptions): HocuspocusProviderWebsocket
```

`HocuspocusWebSocketOptions` accepts `url`, `WebSocketPolyfill`, `onConnect`, `onDisconnect`, and `onStatus`.

#### getSharedWebSocket

Returns the shared WebSocket connection, or `null` when none exists.

```ts
static getSharedWebSocket(): HocuspocusProviderWebsocket | null
```

#### destroySharedWebSocket

Destroys the shared WebSocket connection.

```ts
static destroySharedWebSocket(): void
```

```ts
import { HocuspocusSyncProvider, IndexedDBSyncProvider, KritzelSyncConfig } from '@kritzel/angular-editor';

syncConfig: KritzelSyncConfig = {
  appStateId: 'account-42',
  providers: [
    IndexedDBSyncProvider,
    HocuspocusSyncProvider.with({
      url: 'wss://sync.example.com',
      token: () => this.auth.getAccessToken(),
    }),
  ],
};
```

:::warning
Setting `name` forces every Kritzel document — the app state and all workspaces — into a single server document. Leave it unset so each document keeps its generated `docName`.
:::

---

## Helpers

### hasRemoteSyncProvider

Returns `true` when a sync configuration contains at least one provider of type `'network'`. Kritzel uses it internally to decide whether the share option is available in the editor UI.

```ts
hasRemoteSyncProvider(syncConfig?: KritzelSyncConfig): boolean
```

---

## Debugging

Enable `showSyncProviderInfo` in the editor's `debugInfo` prop, or in the developer section of the settings dialog, to log provider instantiation and connection status to the console. When disabled, providers are created in quiet mode and stay silent.

```ts
debugInfo = { showSyncProviderInfo: true };
```
