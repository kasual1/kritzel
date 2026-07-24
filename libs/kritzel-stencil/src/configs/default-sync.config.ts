import { KritzelSyncConfig } from '../interfaces/sync-config.interface';
import { IndexeddbsyncProvider } from '../providers/indexeddb-sync.provider';

/**
 * Default sync configuration - None
 */
export const DEFAULT_SYNC_CONFIG: KritzelSyncConfig = {
  providers: [IndexeddbsyncProvider],
};
