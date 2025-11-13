# HocuspocusSyncProvider Usage Examples

## Basic Usage (Standalone Mode)

Each provider creates its own WebSocket connection:

```typescript
import { HocuspocusSyncProvider } from 'kritzel-stencil';
import * as Y from 'yjs';

// Create a Y.Doc
const doc = new Y.Doc();

// Create provider with its own WebSocket connection
const provider = new HocuspocusSyncProvider('my-document', doc, {
  url: 'ws://localhost:1234',
  token: 'your-auth-token', // optional
  onConnect: () => console.log('Connected!'),
  onSynced: () => console.log('Document synced!'),
});

// Connect to the server
await provider.connect();

// Later, disconnect
provider.disconnect();

// Clean up when done
provider.destroy();
```

## Multiplexed Mode (Recommended for Multiple Documents)

Share a single WebSocket connection across multiple documents:

### Option 1: Using Static Shared WebSocket

```typescript
import { HocuspocusSyncProvider } from 'kritzel-stencil';
import * as Y from 'yjs';

// Step 1: Create a shared WebSocket connection (do this once)
HocuspocusSyncProvider.createSharedWebSocket({
  url: 'ws://localhost:1234',
  onConnect: () => console.log('WebSocket connected!'),
  onDisconnect: () => console.log('WebSocket disconnected!'),
});

// Step 2: Create multiple providers that share the connection
const doc1 = new Y.Doc();
const doc2 = new Y.Doc();
const doc3 = new Y.Doc();

const provider1 = new HocuspocusSyncProvider('document-1', doc1, {
  token: 'token-for-doc1',
  onSynced: () => console.log('Doc 1 synced!'),
});

const provider2 = new HocuspocusSyncProvider('document-2', doc2, {
  token: 'token-for-doc2',
  onSynced: () => console.log('Doc 2 synced!'),
});

const provider3 = new HocuspocusSyncProvider('document-3', doc3, {
  token: 'token-for-doc3',
  onSynced: () => console.log('Doc 3 synced!'),
});

// All providers now share the same WebSocket connection!

// Connect all providers
await Promise.all([
  provider1.connect(),
  provider2.connect(),
  provider3.connect(),
]);

// Later, when done with all documents:
provider1.destroy();
provider2.destroy();
provider3.destroy();

// Clean up the shared WebSocket
HocuspocusSyncProvider.destroySharedWebSocket();
```

### Option 2: Using Explicit WebSocket Provider

```typescript
import { HocuspocusSyncProvider } from 'kritzel-stencil';
import * as Y from 'yjs';

// Create your own shared WebSocket
const sharedSocket = HocuspocusSyncProvider.createSharedWebSocket({
  url: 'ws://localhost:1234',
});

// Pass it to each provider
const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

const provider1 = new HocuspocusSyncProvider('doc-1', doc1, {
  websocketProvider: sharedSocket,
  token: 'token-1',
});

const provider2 = new HocuspocusSyncProvider('doc-2', doc2, {
  websocketProvider: sharedSocket,
  token: 'token-2',
});
```

## Using with Factory Pattern

```typescript
import { HocuspocusSyncProvider } from 'kritzel-stencil';

// Create a shared WebSocket first
HocuspocusSyncProvider.createSharedWebSocket({
  url: 'ws://localhost:1234',
});

// Create a factory
const providerFactory = HocuspocusSyncProvider.with({
  // Options will be applied to all providers created by this factory
  quiet: false,
  onConnect: () => console.log('Provider connected'),
});

// Use the factory to create providers
const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

const provider1 = providerFactory.create('document-1', doc1);
const provider2 = providerFactory.create('document-2', doc2);
```

## Complete Example: Collaborative Whiteboard

```typescript
import { HocuspocusSyncProvider } from 'kritzel-stencil';
import * as Y from 'yjs';

class CollaborativeApp {
  private documents = new Map<string, Y.Doc>();
  private providers = new Map<string, HocuspocusSyncProvider>();

  constructor() {
    // Initialize shared WebSocket once
    HocuspocusSyncProvider.createSharedWebSocket({
      url: 'ws://localhost:1234',
      onConnect: () => console.log('🟢 WebSocket connected'),
      onDisconnect: () => console.log('🔴 WebSocket disconnected'),
      onStatus: (data) => console.log('Status:', data.status),
    });
  }

  async openDocument(documentId: string, authToken?: string) {
    // Create Y.Doc
    const doc = new Y.Doc();
    this.documents.set(documentId, doc);

    // Create provider with multiplexing
    const provider = new HocuspocusSyncProvider(documentId, doc, {
      token: authToken,
      onSynced: () => console.log(`📄 ${documentId} synced`),
      onConnect: () => console.log(`🔌 ${documentId} connected`),
    });

    this.providers.set(documentId, provider);

    // Connect
    await provider.connect();

    return { doc, provider };
  }

  closeDocument(documentId: string) {
    const provider = this.providers.get(documentId);
    if (provider) {
      provider.disconnect(); // Detaches but keeps shared socket alive
      this.providers.delete(documentId);
    }

    const doc = this.documents.get(documentId);
    if (doc) {
      doc.destroy();
      this.documents.delete(documentId);
    }
  }

  async cleanup() {
    // Destroy all providers
    for (const [id, provider] of this.providers) {
      provider.destroy();
    }
    this.providers.clear();

    // Destroy all documents
    for (const [id, doc] of this.documents) {
      doc.destroy();
    }
    this.documents.clear();

    // Destroy shared WebSocket
    HocuspocusSyncProvider.destroySharedWebSocket();
  }
}

// Usage
const app = new CollaborativeApp();

// Open multiple documents (all share one WebSocket)
await app.openDocument('whiteboard-1', 'user-token-1');
await app.openDocument('whiteboard-2', 'user-token-2');
await app.openDocument('whiteboard-3', 'user-token-3');

// Close a specific document
app.closeDocument('whiteboard-2');

// Clean up everything
await app.cleanup();
```

## Configuration Options

```typescript
interface HocuspocusOptions {
  url?: string;                    // Server URL (standalone mode only)
  name?: string;                   // Override document name
  token?: string | (() => string) | (() => Promise<string>); // Auth token
  websocketProvider?: HocuspocusProviderWebsocket; // For multiplexing
  quiet?: boolean;                 // Suppress console logs
  forceSyncInterval?: false | number; // Force sync interval (ms)
  WebSocketPolyfill?: any;        // For Node.js environments
  
  // Callbacks
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSynced?: () => void;
  onAuthenticationFailed?: (data: any) => void;
  onStatus?: (data: { status: string }) => void;
}
```

## Performance Benefits of Multiplexing

- ✅ **Single WebSocket connection** for all documents
- ✅ **Reduced overhead** - no multiple handshakes
- ✅ **Better resource usage** - less memory and network
- ✅ **Faster document switching** - connection already established
- ✅ **Shared authentication** - authenticate once per connection

## When to Use Each Mode

### Standalone Mode
- Single document application
- Simple prototypes
- Different servers per document

### Multiplexed Mode (Recommended)
- Multiple documents in the same app
- Collaborative workspaces with many rooms
- Performance-critical applications
- Mobile apps (limited connections)
