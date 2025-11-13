import { KritzelSyncConfig } from '../interfaces/sync-config.interface';
import { IndexedDBSyncProvider } from '../classes/providers/indexeddb-sync-provider.class';
import { BroadcastSyncProvider } from '../classes/providers/broadcast-sync-provider.class';
import { HocuspocusSyncProvider } from '../classes/providers/hocuspocus-sync-provider.class';

// Initialize shared WebSocket for multiplexing across all documents
HocuspocusSyncProvider.createSharedWebSocket({
  url: 'ws://localhost:1234',
  onConnect: () => console.info('🟢 Hocuspocus WebSocket connected'),
  onDisconnect: () => console.info('🔴 Hocuspocus WebSocket disconnected'),
});

/**
 * Default sync configuration - IndexedDB + BroadcastChannel + Hocuspocus (multiplexed)
 * All documents will share a single WebSocket connection to the Hocuspocus server
 */
export const DEFAULT_SYNC_CONFIG: KritzelSyncConfig = {
  providers: [
    IndexedDBSyncProvider,
    BroadcastSyncProvider,
    HocuspocusSyncProvider, // Uses shared WebSocket automatically
  ],
};
