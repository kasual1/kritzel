import { KritzelAsset } from '../../../interfaces/asset.interface';
import { IAssetStorageProvider, KritzelAssetPutMetadata } from '../../../interfaces/asset-provider.interface';

/** Default database name used by IndexedDBAssetProvider. */
const DEFAULT_DB_NAME = 'kritzel-assets';
/** Object store holding the binary payloads. */
const BLOB_STORE = 'blobs';
/** Object store holding the asset metadata. */
const META_STORE = 'metadata';
/** Database schema version. Increment when changing store layout. */
const DB_VERSION = 1;

/**
 * Options for {@link IndexedDBAssetProvider}.
 */
export interface IndexedDBAssetProviderOptions {
  /** Custom database name. Defaults to `kritzel-assets`. */
  dbName?: string;

  /**
   * Quiet mode - suppress console output (optional, defaults to false)
   */
  quiet?: boolean;
}

/**
 * Local-only asset storage provider backed by IndexedDB.
 *
 * Stores asset blobs and metadata in a dedicated database (separate from
 * the Yjs IndexedDB sync provider). Resolved URLs are `blob:` object URLs
 * created on demand and cached to avoid redundant allocations.
 *
 * This provider is always-safe to include in an asset storage config; it
 * doubles as an offline cache when combined with a remote provider.
 */
export class IndexedDBAssetProvider implements IAssetStorageProvider {
  readonly type = 'local';
  readonly name = 'IndexedDBAssetProvider';

  private _dbName: string;
  private _db: IDBDatabase | null = null;
  /** In-memory cache of id -> object URL to avoid re-creating blob URLs. */
  private _urlCache = new Map<string, string>();
  /** In-memory known-present ids to let `canResolve` answer synchronously. */
  private _knownIds = new Set<string>();

  constructor(options?: IndexedDBAssetProviderOptions) {
    this._dbName = options?.dbName ?? DEFAULT_DB_NAME;
  }

  /**
   * Factory helper enabling use as `IndexedDBAssetProvider.with({ dbName: '...' })`
   * inside a `KritzelAssetStorageConfig.providers` array.
   */
  static with(options: IndexedDBAssetProviderOptions): { create: () => IAssetStorageProvider } {
    return { create: () => new IndexedDBAssetProvider(options) };
  }

  async init(): Promise<void> {
    if (this._db) return;
    this._db = await this.openDatabase();
    // Warm up the known-ids cache so canResolve can answer synchronously.
    await this.loadKnownIds();
  }

  destroy(): void {
    for (const url of this._urlCache.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
    this._urlCache.clear();
    this._knownIds.clear();
    if (this._db) {
      this._db.close();
      this._db = null;
    }
  }

  canResolve(id: string): boolean {
    return this._knownIds.has(id);
  }

  async put(blob: Blob, metadata: KritzelAssetPutMetadata): Promise<KritzelAsset> {
    const db = await this.ensureDb();
    const id = metadata.id ?? this.generateUuid();
    const asset: KritzelAsset = {
      id,
      kind: metadata.kind ?? 'file',
      mimeType: metadata.mimeType,
      size: blob.size,
      createdAt: Date.now(),
      width: metadata.width,
      height: metadata.height,
      durationMs: metadata.durationMs,
      originalFilename: metadata.originalFilename,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([BLOB_STORE, META_STORE], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      tx.objectStore(BLOB_STORE).put(blob, id);
      tx.objectStore(META_STORE).put(asset, id);
    });

    this._knownIds.add(id);
    return asset;
  }

  async resolve(id: string): Promise<string> {
    const cached = this._urlCache.get(id);
    if (cached) return cached;

    const blob = await this.fetch(id);
    const url = URL.createObjectURL(blob);
    this._urlCache.set(id, url);
    return url;
  }

  async fetch(id: string): Promise<Blob> {
    const db = await this.ensureDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const req = tx.objectStore(BLOB_STORE).get(id);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });

    if (!blob) {
      throw new Error(`[IndexedDBAssetProvider] Asset ${id} not found`);
    }
    this._knownIds.add(id);
    return blob;
  }

  async delete(id: string): Promise<void> {
    const db = await this.ensureDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([BLOB_STORE, META_STORE], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(BLOB_STORE).delete(id);
      tx.objectStore(META_STORE).delete(id);
    });

    const url = this._urlCache.get(id);
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      this._urlCache.delete(id);
    }
    this._knownIds.delete(id);
  }

  /**
   * Returns the metadata record for a stored asset, or `undefined` when
   * the asset is not present locally.
   */
  async getMetadata(id: string): Promise<KritzelAsset | undefined> {
    const db = await this.ensureDb();
    return new Promise<KritzelAsset | undefined>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).get(id);
      req.onsuccess = () => resolve(req.result as KritzelAsset | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Returns every stored asset that still has one or more remote
   * providers marked as pending. Used by the resolver on init to
   * re-enqueue uploads that were interrupted (e.g. the user reloaded
   * the tab while a background upload was retrying).
   */
  async listAssetsWithPendingRemotes(): Promise<KritzelAsset[]> {
    const db = await this.ensureDb();
    return new Promise<KritzelAsset[]>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).getAll();
      req.onsuccess = () => {
        const all = (req.result as KritzelAsset[]) ?? [];
        resolve(all.filter(a => Array.isArray(a.pendingRemotes) && a.pendingRemotes.length > 0));
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Replaces the `pendingRemotes` list on an asset's metadata record.
   * Passing an empty array clears the pending flag entirely.
   */
  async setPendingRemotes(id: string, providerNames: string[]): Promise<void> {
    const db = await this.ensureDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(META_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        const existing = req.result as KritzelAsset | undefined;
        if (!existing) return; // Asset gone; nothing to update.
        const updated: KritzelAsset = { ...existing };
        if (providerNames.length > 0) {
          updated.pendingRemotes = providerNames;
        } else {
          delete updated.pendingRemotes;
        }
        store.put(updated, id);
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this._db) {
      await this.init();
    }
    return this._db!;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(this._dbName, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadKnownIds(): Promise<void> {
    const db = this._db;
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).getAllKeys();
      req.onsuccess = () => {
        for (const key of req.result as IDBValidKey[]) {
          if (typeof key === 'string') this._knownIds.add(key);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID (e.g. older jsdom).
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
