import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ISyncProvider } from '../../../interfaces/sync-provider.interface';

/**
 * Options for IndexedDB sync provider
 */
export interface IndexedDBOptions {
  /**
   * Custom database name (optional)
   */
  name?: string;
}

/**
 * IndexedDB sync provider for local persistence
 */
export class IndexedDBSyncProvider implements ISyncProvider {
  static readonly providerType = 'local' as const;
  readonly type = 'local';
  private provider: IndexeddbPersistence;
  private isConnected: boolean = false;

  constructor(docName: string, doc: Y.Doc, options?: IndexedDBOptions) {
    const dbName = options?.name || docName;
    this.provider = new IndexeddbPersistence(dbName, doc);
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise<void>(resolve => {
      this.provider.on('synced', () => {
        this.isConnected = true;
        resolve();
      });
    });
  }

  disconnect(): void {
    // IndexedDB doesn't need explicit disconnect
    this.isConnected = false;
  }

  async reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  destroy(): void {
    if (this.provider) {
      this.provider.destroy();
    }
    this.isConnected = false;
  }
}
