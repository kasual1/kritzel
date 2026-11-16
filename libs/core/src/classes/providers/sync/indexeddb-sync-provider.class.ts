import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ISyncProvider } from '../../../interfaces/sync-provider.interface';
import { toLegacyDocumentNames } from '../../../migrations/legacy-brand';
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
  /** Names this document's database had under the library's former names, newest first, if it uses the default name. */
  private readonly legacyDbNames: readonly string[];

  constructor(docName: string, doc: Y.Doc, options?: IndexedDBOptions) {
    const dbName = options?.name || docName;
    this.doc = doc;
    this.legacyDbNames = options?.name ? [] : toLegacyDocumentNames(dbName);
    this.provider = new IndexeddbPersistence(dbName, doc);
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    await new Promise<void>(resolve => {
      this.provider.on('synced', () => resolve());
    });
    await this.importLegacyDocuments();
    this.isConnected = true;
  }

  /**
   * Merges the documents saved under the database's former names, where they exist, before the
   * document is reported as loaded. Each is merged on its own, so one that cannot be read does not
   * keep the others out; merging both is safe, because Yjs skips content the document already has.
   */
  private async importLegacyDocuments(): Promise<void> {
    for (const legacyDbName of this.legacyDbNames) {
      try {
        await importLegacyIndexedDbDocument(legacyDbName, this.doc);
      } catch (error) {
        console.warn(`[IndexedDBSyncProvider] Could not import legacy database "${legacyDbName}":`, error);
      }
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
