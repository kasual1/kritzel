import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ISyncProvider } from '../../../interfaces/sync-provider.interface';
import { toLegacyDocumentName } from '../../../migrations/legacy-brand';
import { importLegacyIndexedDbDocument } from '../../../migrations/legacy-indexeddb';

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
  static readonly type = 'local' as const;
  readonly type = 'local';
  private provider: IndexeddbPersistence;
  private isConnected: boolean = false;
  private readonly doc: Y.Doc;
  /** Name of the database this document had before the rename, if it uses the default name. */
  private readonly legacyDbName: string | null;

  constructor(docName: string, doc: Y.Doc, options?: IndexedDBOptions) {
    const dbName = options?.name || docName;
    this.doc = doc;
    this.legacyDbName = options?.name ? null : toLegacyDocumentName(dbName);
    this.provider = new IndexeddbPersistence(dbName, doc);
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    await new Promise<void>(resolve => {
      this.provider.on('synced', () => resolve());
    });
    await this.importLegacyDocument();
    this.isConnected = true;
  }

  /**
   * Merges the document saved under its pre-rename database name, if there is one,
   * before the document is reported as loaded.
   */
  private async importLegacyDocument(): Promise<void> {
    if (!this.legacyDbName) {
      return;
    }
    try {
      await importLegacyIndexedDbDocument(this.legacyDbName, this.doc);
    } catch (error) {
      console.warn(`[IndexedDBSyncProvider] Could not import legacy database "${this.legacyDbName}":`, error);
    }
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
