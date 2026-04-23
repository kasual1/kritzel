import { KritzelAsset } from '../../interfaces/asset.interface';
import {
  AssetProviderConfig,
  AssetProviderFactory,
  IAssetStorageProvider,
  KritzelAssetPutMetadata,
} from '../../interfaces/asset-provider.interface';
import { KritzelAssetStorageConfig } from '../../interfaces/asset-storage-config.interface';
import { IndexedDBAssetProvider } from './indexeddb-asset-provider.class';

/** In-memory retry state for a pending remote upload. */
interface PendingUpload {
  id: string;
  providerName: string;
  /** Monotonically increasing retry counter for exponential backoff. */
  attempts: number;
  /** Next earliest retry time (ms since epoch). */
  nextAttemptAt: number;
}

const BASE_RETRY_DELAY_MS = 2_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000; // 5 minutes

/**
 * Orchestrates asset storage across one or more providers.
 *
 * Responsibilities:
 *  - Instantiates providers from a {@link KritzelAssetStorageConfig}.
 *  - Always ensures an {@link IndexedDBAssetProvider} is present as the
 *    local cache / optimistic write buffer.
 *  - Implements a write-through upload pipeline: bytes are written to the
 *    local provider immediately (so UI renders instantly), and remote
 *    providers receive a copy via an in-memory retry loop with
 *    exponential backoff.
 *  - Resolves asset ids to URLs by walking providers in order; the local
 *    provider serves as a cache for remote assets.
 *
 * Crash / reload resilience: the "needs upload" state is stored directly
 * on the asset's metadata record in the local IndexedDB provider (as
 * `KritzelAsset.pendingRemotes`). On `init()` the resolver scans for any
 * such records and re-enqueues them, so uploads that were interrupted
 * by a reload eventually complete without requiring a separate queue DB.
 */
export class KritzelAssetResolver {
  private _providers: IAssetStorageProvider[] = [];
  private _local: IndexedDBAssetProvider | null = null;
  /** Remote providers ordered as configured. */
  private _remoteProviders: IAssetStorageProvider[] = [];
  private _initialized = false;
  /** In-memory retry state keyed by `${id}::${providerName}`. */
  private _pending = new Map<string, PendingUpload>();
  private _flushTimer: ReturnType<typeof setTimeout> | null = null;
  private _destroyed = false;
  /** Dedupes concurrent resolves of the same id. */
  private _resolvePromises = new Map<string, Promise<string>>();

  /**
   * Whether any remote provider is configured. Used by the engine to
   * decide whether to warn about a missing remote provider when Yjs is
   * configured for network sync.
   */
  get hasRemoteProvider(): boolean {
    return this._remoteProviders.length > 0;
  }

  /** Returns the local (IndexedDB) provider instance, if available. */
  get localProvider(): IndexedDBAssetProvider | null {
    return this._local;
  }

  /**
   * Initializes the resolver with the given configuration. Idempotent.
   *
   * @param config - User-supplied provider list. An `IndexedDBAssetProvider`
   *                 is automatically prepended when the list contains none,
   *                 so local caching is always available.
   */
  async init(config?: KritzelAssetStorageConfig): Promise<void> {
    if (this._initialized) return;

    const providers = this.instantiateProviders(config?.providers ?? []);

    // Ensure a local provider always exists so uploads can be optimistic
    // and remote misses can be cached for later offline access.
    const hasLocal = providers.some(p => p.type === 'local');
    if (!hasLocal) {
      providers.unshift(new IndexedDBAssetProvider());
    }

    this._providers = providers;
    this._local = (providers.find(p => p instanceof IndexedDBAssetProvider) as IndexedDBAssetProvider) ?? null;
    this._remoteProviders = providers.filter(p => p.type === 'remote');

    await Promise.all(this._providers.map(p => p.init()));

    // Re-enqueue any uploads that were interrupted before completing.
    await this.recoverPendingUploads();

    this._initialized = true;

    if (this._pending.size > 0) {
      this.scheduleFlush(0);
    }
  }

  /** Tears down the resolver and all providers. */
  destroy(): void {
    this._destroyed = true;
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
    for (const provider of this._providers) {
      try {
        provider.destroy();
      } catch {
        /* ignore */
      }
    }
    this._providers = [];
    this._local = null;
    this._remoteProviders = [];
    this._pending.clear();
    this._resolvePromises.clear();
    this._initialized = false;
  }

  /**
   * Uploads a blob through the write-through pipeline.
   *
   *   1. The local provider stores the bytes immediately and assigns the id.
   *   2. Remote providers are marked pending on the local metadata and
   *      scheduled via the in-memory retry loop.
   *
   * Callers receive the asset descriptor synchronously after the local
   * write completes; remote replication happens in the background.
   */
  async put(blob: Blob, metadata: KritzelAssetPutMetadata): Promise<KritzelAsset> {
    this.assertInitialized();

    const id = metadata.id ?? this.generateUuid();
    const fullMetadata: KritzelAssetPutMetadata = { ...metadata, id };

    // Always write to the local provider first so the UI can render
    // immediately and offline usage is supported.
    let asset: KritzelAsset | null = null;
    if (this._local) {
      asset = await this._local.put(blob, fullMetadata);
    }

    if (this._remoteProviders.length > 0) {
      const providerNames = this._remoteProviders.map(p => p.name);
      // Persist the pending list on the metadata so a reload can
      // rediscover in-flight uploads.
      if (this._local) {
        await this._local.setPendingRemotes(id, providerNames);
      }
      for (const name of providerNames) {
        this._pending.set(this.pendingKey(id, name), {
          id,
          providerName: name,
          attempts: 0,
          nextAttemptAt: Date.now(),
        });
      }
    }

    if (!asset) {
      // No local provider? Upload synchronously to the first remote.
      if (this._remoteProviders.length === 0) {
        throw new Error('[KritzelAssetResolver] No providers configured to store asset.');
      }
      asset = await this._remoteProviders[0].put(blob, fullMetadata);
    }

    this.scheduleFlush(0);
    return asset;
  }

  /**
   * Resolves an asset id to a URL usable as `<img src>`. Providers are
   * tried in order; the first successful response wins.
   *
   * Remote hits are cached into the local provider for future offline use.
   */
  async resolve(id: string): Promise<string> {
    this.assertInitialized();

    const inflight = this._resolvePromises.get(id);
    if (inflight) return inflight;

    const promise = (async () => {
      // Fast path: local cache.
      if (this._local && this._local.canResolve(id)) {
        return this._local.resolve(id);
      }

      // Walk remote providers.
      let lastError: unknown;
      for (const provider of this._providers) {
        if (provider === this._local) continue;
        try {
          // Prefer `fetch` so we can cache the bytes locally; fall back
          // to `resolve` if fetch is unavailable or rejects.
          const blob = await provider.fetch(id);
          if (this._local) {
            try {
              await this._local.put(blob, {
                id,
                mimeType: blob.type || 'application/octet-stream',
                kind: 'file',
              });
            } catch {
              /* caching failure is non-fatal */
            }
            return this._local.resolve(id);
          }
          return URL.createObjectURL(blob);
        } catch (err) {
          lastError = err;
          // Try next provider.
        }
      }

      throw new Error(`[KritzelAssetResolver] Failed to resolve asset ${id}: ${String(lastError)}`);
    })();

    this._resolvePromises.set(id, promise);
    try {
      return await promise;
    } finally {
      this._resolvePromises.delete(id);
    }
  }

  /**
   * Returns the raw bytes for an asset. Used for export flows that embed
   * the bytes inline (e.g. SVG export).
   */
  async fetchBlob(id: string): Promise<Blob> {
    this.assertInitialized();
    let lastError: unknown;
    // Prefer local to avoid network round-trips.
    const ordered = this._local
      ? [this._local, ...this._providers.filter(p => p !== this._local)]
      : this._providers;
    for (const provider of ordered) {
      try {
        return await provider.fetch(id);
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(`[KritzelAssetResolver] Failed to fetch blob for ${id}: ${String(lastError)}`);
  }

  /**
   * Uploads a legacy data-URL and returns the new asset. Used by the
   * migration step for existing `KritzelImage.src` payloads.
   */
  async putDataUrl(dataUrl: string, metadata: Omit<KritzelAssetPutMetadata, 'mimeType'> & { mimeType?: string }): Promise<KritzelAsset> {
    const blob = await this.dataUrlToBlob(dataUrl);
    return this.put(blob, {
      ...metadata,
      mimeType: metadata.mimeType ?? blob.type ?? 'application/octet-stream',
    });
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private instantiateProviders(configs: AssetProviderConfig[]): IAssetStorageProvider[] {
    return configs.map(config => {
      // A class constructor is a function; anything else is a factory
      // object with a `create` method.
      if (typeof config === 'function') {
        return new (config as new () => IAssetStorageProvider)();
      }
      return (config as AssetProviderFactory).create();
    });
  }

  private pendingKey(id: string, providerName: string): string {
    return `${id}::${providerName}`;
  }

  /**
   * Reads pending uploads back from the local provider's metadata and
   * seeds the in-memory retry map. Only uploads targeting remote
   * providers that are still configured are re-enqueued.
   */
  private async recoverPendingUploads(): Promise<void> {
    if (!this._local || this._remoteProviders.length === 0) return;

    const pending = await this._local.listAssetsWithPendingRemotes();
    const configured = new Set(this._remoteProviders.map(p => p.name));
    const now = Date.now();

    for (const asset of pending) {
      const names = (asset.pendingRemotes ?? []).filter(n => configured.has(n));
      if (names.length === 0) {
        // None of the previously pending providers are still configured.
        await this._local.setPendingRemotes(asset.id, []);
        continue;
      }
      for (const name of names) {
        this._pending.set(this.pendingKey(asset.id, name), {
          id: asset.id,
          providerName: name,
          attempts: 0,
          nextAttemptAt: now,
        });
      }
    }
  }

  private scheduleFlush(delayMs: number): void {
    if (this._destroyed) return;
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      void this.flushQueue();
    }, Math.max(0, delayMs));
  }

  private async flushQueue(): Promise<void> {
    if (this._destroyed) return;
    if (!this._local) return; // Cannot flush without local source of truth.

    const now = Date.now();
    let nextRetryIn = Number.POSITIVE_INFINITY;

    for (const [key, job] of Array.from(this._pending.entries())) {
      if (job.nextAttemptAt > now) {
        nextRetryIn = Math.min(nextRetryIn, job.nextAttemptAt - now);
        continue;
      }

      const provider = this._remoteProviders.find(p => p.name === job.providerName);
      if (!provider) {
        this._pending.delete(key);
        continue;
      }

      let blob: Blob;
      let metadata: KritzelAsset | undefined;
      try {
        [blob, metadata] = await Promise.all([
          this._local.fetch(job.id),
          this._local.getMetadata(job.id),
        ]);
      } catch {
        // Bytes no longer available locally (asset deleted?). Drop job.
        this._pending.delete(key);
        continue;
      }

      try {
        await provider.put(blob, {
          id: job.id,
          mimeType: metadata?.mimeType ?? blob.type ?? 'application/octet-stream',
          kind: metadata?.kind,
          width: metadata?.width,
          height: metadata?.height,
          durationMs: metadata?.durationMs,
          originalFilename: metadata?.originalFilename,
        });
        this._pending.delete(key);
        await this.clearPendingRemote(job.id, job.providerName);
      } catch (err) {
        job.attempts += 1;
        const delay = Math.min(
          MAX_RETRY_DELAY_MS,
          BASE_RETRY_DELAY_MS * Math.pow(2, job.attempts - 1),
        );
        job.nextAttemptAt = Date.now() + delay;
        nextRetryIn = Math.min(nextRetryIn, delay);
        console.warn(
          `[KritzelAssetResolver] Upload to ${provider.name} failed for ${job.id} (attempt ${job.attempts}). ` +
            `Retrying in ${Math.round(delay / 1000)}s.`,
          err,
        );
      }
    }

    if (this._pending.size > 0 && Number.isFinite(nextRetryIn)) {
      this.scheduleFlush(nextRetryIn);
    }
  }

  /**
   * Removes `providerName` from the `pendingRemotes` list on the asset's
   * metadata record. Clears the field entirely when no providers remain.
   */
  private async clearPendingRemote(id: string, providerName: string): Promise<void> {
    if (!this._local) return;
    const meta = await this._local.getMetadata(id);
    if (!meta) return;
    const remaining = (meta.pendingRemotes ?? []).filter(n => n !== providerName);
    await this._local.setPendingRemotes(id, remaining);
  }

  private assertInitialized(): void {
    if (!this._initialized) {
      throw new Error('[KritzelAssetResolver] Not initialized. Call init() first.');
    }
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }
}
