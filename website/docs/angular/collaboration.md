---
sidebar_label: Collaboration
title: "Real-time Collaboration | Kritzel for Angular"
description: "Enable real-time multi-user editing on the Kritzel canvas in your Angular app using Hocuspocus and Yjs."
---
# Collaboration

Kritzel uses [Yjs](https://yjs.dev/) CRDTs under the hood for real-time collaboration and persistence. All canvas objects are stored in a Yjs document (`Y.Doc`), enabling conflict-free merging across multiple clients.

## Configuring Sync Providers

Pass a `syncConfig` prop to `<kritzel-editor>` or `<kritzel-engine>`:

```ts
import { IndexedDBSyncProvider, WebSocketSyncProvider } from 'kritzel-stencil';

const editor = document.querySelector('kritzel-editor');
editor.syncConfig = {
  providers: [
    IndexedDBSyncProvider,
    WebSocketSyncProvider.with({ url: 'wss://your-server.com' }),
  ],
};
```

## Available Providers

### `IndexedDBSyncProvider`

Persists canvas data locally in IndexedDB. Data survives page reloads and browser restarts.

```ts
import { IndexedDBSyncProvider } from 'kritzel-stencil';

editor.syncConfig = {
  providers: [IndexedDBSyncProvider],
};
```

### `BroadcastSyncProvider`

Syncs canvas data across browser tabs using the BroadcastChannel API. Useful for same-browser multi-tab editing.

```ts
import { BroadcastSyncProvider } from 'kritzel-stencil';

editor.syncConfig = {
  providers: [BroadcastSyncProvider],
};
```

### `InMemorySyncProvider`

Holds canvas data in memory for the current page session. State survives the component being removed from the DOM and remounted, but is lost on page reload. Intended for documentation demos.

```ts
import { InMemorySyncProvider } from 'kritzel-stencil';

editor.syncConfig = {
  providers: [InMemorySyncProvider],
};
```

You can clear the cache programmatically — useful for a "reset canvas" button in a demo:

```ts
import { InMemorySyncProvider } from 'kritzel-stencil';

// Clear state for a specific doc name
InMemorySyncProvider.clear('my-doc-name');

// Clear all in-memory state
InMemorySyncProvider.clear();
```

### `WebSocketSyncProvider`

Real-time sync via a WebSocket server (compatible with [y-websocket](https://github.com/yjs/y-websocket)).

```ts
import { WebSocketSyncProvider } from 'kritzel-stencil';

editor.syncConfig = {
  providers: [
    WebSocketSyncProvider.with({ url: 'wss://your-server.com' }),
  ],
};
```

### `HocuspocusSyncProvider`

Real-time sync via a [Hocuspocus](https://tiptap.dev/hocuspocus) server. Supports authentication tokens and multiplexed WebSocket connections.

```ts
import { HocuspocusSyncProvider } from 'kritzel-stencil';

editor.syncConfig = {
  providers: [
    HocuspocusSyncProvider.with({
      url: 'wss://your-hocuspocus-server.com',
      token: 'your-auth-token',
    }),
  ],
};
```

## Combining Providers

Providers can be combined. A common pattern is local persistence + remote sync:

```ts
editor.syncConfig = {
  providers: [
    IndexedDBSyncProvider,                                         // local persistence
    BroadcastSyncProvider,                                         // cross-tab sync
    WebSocketSyncProvider.with({ url: 'wss://your-server.com' }), // remote sync
  ],
};
```

## Hocuspocus Multiplexing

When working with multiple documents (e.g. multiple workspaces connecting to different rooms), the Hocuspocus provider supports multiplexing — sharing a single WebSocket connection across all documents.

### Setup

```ts
import { HocuspocusSyncProvider } from 'kritzel-stencil';

// Step 1: Create a shared WebSocket connection (once)
HocuspocusSyncProvider.createSharedWebSocket({
  url: 'ws://localhost:1234',
  onConnect: () => console.log('WebSocket connected'),
  onDisconnect: () => console.log('WebSocket disconnected'),
});

// Step 2: Create providers that share the connection
const provider1 = new HocuspocusSyncProvider('document-1', doc1, {
  token: 'token-for-doc1',
});

const provider2 = new HocuspocusSyncProvider('document-2', doc2, {
  token: 'token-for-doc2',
});

await Promise.all([provider1.connect(), provider2.connect()]);
```

### Factory Pattern

```ts
const factory = HocuspocusSyncProvider.with({
  quiet: false,
  onConnect: () => console.log('Connected'),
});

const provider1 = factory.create('document-1', doc1);
const provider2 = factory.create('document-2', doc2);
```

### Cleanup

```ts
provider1.destroy();
provider2.destroy();
HocuspocusSyncProvider.destroySharedWebSocket();
```

### Benefits of Multiplexing

- Single WebSocket connection for all documents
- Reduced overhead — no multiple handshakes
- Better resource usage — less memory and network
- Faster document switching — connection already established
- Shared authentication — authenticate once per connection

## Hocuspocus Configuration Options

```ts
interface HocuspocusOptions {
  url?: string;                    // Server URL (standalone mode only)
  name?: string;                   // Override document name
  token?: string | (() => string) | (() => Promise<string>); // Auth token
  websocketProvider?: HocuspocusProviderWebsocket; // For multiplexing
  quiet?: boolean;                 // Suppress console logs
  forceSyncInterval?: false | number; // Force sync interval (ms)
  WebSocketPolyfill?: any;         // For Node.js environments

  // Callbacks
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSynced?: () => void;
  onAuthenticationFailed?: (data: any) => void;
  onStatus?: (data: { status: string }) => void;
}
```
