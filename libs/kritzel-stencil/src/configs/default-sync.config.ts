import { KritzelSyncConfig } from '../interfaces/sync-config.interface';
import { IndexedDBSyncProvider } from '../classes/providers/indexeddb-sync-provider.class';
import { BroadcastSyncProvider } from '../classes/providers/broadcast-sync-provider.class';
import { HocuspocusSyncProvider } from '../classes/providers/hocuspocus-sync-provider.class';

/**
 * Default sync configuration - IndexedDB + BroadcastChannel
 */
export const DEFAULT_SYNC_CONFIG: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider, BroadcastSyncProvider, HocuspocusSyncProvider.with({url: 'ws://localhost:1234'})],
};
