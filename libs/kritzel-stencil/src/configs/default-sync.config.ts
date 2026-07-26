import { KritzelSyncConfig } from '../interfaces/sync-config.interface';
import { IndexedDBSyncProvider } from '../classes/providers/sync/indexeddb-sync-provider.class';

/**
 * Default sync configuration - None
 */
export const DEFAULT_SYNC_CONFIG: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
};
