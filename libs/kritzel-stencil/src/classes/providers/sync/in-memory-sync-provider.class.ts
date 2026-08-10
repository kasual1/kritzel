import * as Y from 'yjs';
import { ISyncProvider } from '../../../interfaces/sync-provider.interface';

/**
 * Module-scoped cache that survives component removal and remounting
 * within the same JS runtime. Cleared on page reload.
 */
const sessionCache = new Map<string, Uint8Array>();

/**
 * Options for InMemory sync provider
 */
export interface InMemoryOptions {
  /**
   * Custom cache key (optional). Defaults to the docName.
   */
  name?: string;
}

/**
 * In-memory sync provider for session-scoped persistence.
 *
 * State survives the component being removed from the DOM and later
 * re-added within the same page session, but is lost on page reload.
 * Intended for documentation demos where durable IndexedDB persistence
 * is not desired.
 */
export class InMemorySyncProvider implements ISyncProvider {
  static readonly type = 'local' as const;
  readonly type = 'local';
  private readonly doc: Y.Doc;
  private readonly cacheKey: string;
  private isConnected: boolean = false;

  constructor(docName: string, doc: Y.Doc, options?: InMemoryOptions) {
    this.doc = doc;
    this.cacheKey = options?.name ?? docName;
  }

  private readonly handleUpdate = (_update: Uint8Array, origin: unknown): void => {
    // Skip updates that originated from connect() rehydration to avoid a
    // redundant re-encode of the state we just applied.
    if (origin === this) {
      return;
    }
    sessionCache.set(this.cacheKey, Y.encodeStateAsUpdate(this.doc));
  };

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const cached = sessionCache.get(this.cacheKey);
    if (cached) {
      Y.applyUpdate(this.doc, cached, this);
    }

    this.doc.on('update', this.handleUpdate);
    this.isConnected = true;
  }

  disconnect(): void {
    this.isConnected = false;
  }

  async reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  destroy(): void {
    this.doc.off('update', this.handleUpdate);
    this.isConnected = false;
  }

  /**
   * Clears the in-memory cache.
   *
   * @param name - If provided, only the entry with this cache key is removed.
   *               If omitted, all entries are cleared.
   */
  static clear(name?: string): void {
    if (name !== undefined) {
      sessionCache.delete(name);
    } else {
      sessionCache.clear();
    }
  }
}
