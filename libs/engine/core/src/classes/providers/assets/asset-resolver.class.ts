import { KritzelAsset } from '../../../interfaces/asset.interface';
import {
  AssetProviderConfig,
  AssetProviderFactory,
  IAssetStorageProvider,
  KritzelAssetPutMetadata,
} from '../../../interfaces/asset-provider.interface';
import { KritzelAssetStorageConfig } from '../../../interfaces/asset-storage-config.interface';
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
 * Thrown when an asset id cannot be located in any configured provider.
 *
 * This is distinct from transport / network errors: callers (e.g.
 * {@link KritzelImage.ensureResolved}) use the type to decide whether a
 * failure is permanent (asset truly missing) or transient (network blip,
 * remote temporarily unreachable) and should be retried without
 * burning the per-page-load attempt budget.
 */
export class AssetNotFoundError extends Error {
  readonly assetId: string;
  constructor(assetId: string, message?: string) {
    super(message ?? `[KritzelAssetResolver] Asset ${assetId} not found in any configured provider.`);
    this.name = 'AssetNotFoundError';
    this.assetId = assetId;
  }
}

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
  /**
   * Promise that resolves when the resolver is ready to serve requests.
   *
   * Created lazily so that callers issuing `resolve()` / `fetchBlob()` /
   * `put()` before {@link init} has been invoked are queued instead of
   * rejected. This eliminates a race on reload where the renderer
   * triggers `KritzelImage.ensureResolved()` before the engine has
   * finished wiring up the asset storage layer.
   */
  private _readyPromise: Promise<void> | null = null;
  private _resolveReady: (() => void) | null = null;
  private _rejectReady: ((err: Error) => void) | null = null;
  /** In-memory retry state keyed by `${id}::${providerName}`. */
  private _pending = new Map<string, PendingUpload>();
  private _flushTimer: ReturnType<typeof setTimeout> | null = null;
  private _destroyed = false;
  private _quiet = true;
  /** Dedupes concurrent resolves of the same id. */
  private _resolvePromises = new Map<string, Promise<string>>();

  /** Enables or disables resolver diagnostic logging. */
  setShowInfo(show: boolean): void {
    this._quiet = !show;
  }

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
    // Ensure the deferred ready promise exists before any async work so
    // concurrent callers awaiting `ensureReady()` are unblocked together.
    this.getReadyPromise();

    const providers = this.instantiateProviders(config?.providers ?? []);

    // Ensure a local provider always exists so uploads can be optimistic
    // and remote misses can be cached for later offline access.
    const hasLocal = providers.some(p => p.type === 'local');
    if (!hasLocal) {
      providers.unshift(new IndexedDBAssetProvider());
    }

    // Normalize order: local providers first so resolution always
    // hits the local cache before making network requests.
    providers.sort((a, b) => {
      if (a.type === 'local' && b.type !== 'local') return -1;
      if (a.type !== 'local' && b.type === 'local') return 1;
      return 0;
    });

    this._providers = providers;
    // Use type + name instead of `instanceof` to find the local provider.
    // `instanceof` can fail across module boundaries when the external app
    // bundles its own copy of IndexedDBAssetProvider.
    this._local = (providers.find(
      p => p.type === 'local' && p.name === 'IndexedDBAssetProvider',
    ) as IndexedDBAssetProvider) ?? null;
    this._remoteProviders = providers.filter(p => p.type === 'remote');

    // Initialize the local provider first (must succeed), then remote
    // providers individually so a failing remote does not block init.
    if (this._local) {
      await this._local.init();
    }
    for (const provider of this._remoteProviders) {
      try {
        await provider.init();
      } catch (err) {
        if (this.canLogInfo()) {
          console.warn(
            `[Kritzel] Asset resolver remote provider "${provider.name}" failed to initialize. ` +
              `Assets will be served from the local provider until the remote becomes available.`,
            err,
          );
        }
      }
    }

    // Re-enqueue any uploads that were interrupted before completing.
    await this.recoverPendingUploads();

    this._initialized = true;
    // Release any callers that were queued behind init.
    if (this._resolveReady) {
      this._resolveReady();
      this._resolveReady = null;
      this._rejectReady = null;
    }

    if (this.canLogInfo()) {
      this.logProviderConfiguration();
    }

    if (this._pending.size > 0) {
      this.scheduleFlush(0);
    }
  }

  /** Tears down the resolver and all providers. */
  destroy(): void {
    if (this.canLogInfo()) {
      console.info('[Kritzel] Asset resolver destroyed');
    }
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
    // Reject any callers still waiting on init so they don't hang forever.
    if (this._rejectReady) {
      this._rejectReady(new Error('[KritzelAssetResolver] Destroyed before initialization completed.'));
    }
    this._readyPromise = null;
    this._resolveReady = null;
    this._rejectReady = null;
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
    await this.ensureReady();

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
    await this.ensureReady();

    const inflight = this._resolvePromises.get(id);
    if (inflight) return inflight;

    const promise = (async () => {
      // Fast path: local cache.
      if (this._local && this._local.canResolve(id)) {
        return this._local.resolve(id);
      }

      // Walk remote providers.
      let lastError: unknown;
      let remoteAttempts = 0;
      for (const provider of this._providers) {
        if (provider === this._local) continue;
        remoteAttempts++;
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

      // No remote providers were tried (only local exists and missed):
      // the asset is definitively absent locally and nowhere else to
      // look. Surface a typed error so callers can distinguish a true
      // miss from a transient network failure.
      if (remoteAttempts === 0) {
        throw new AssetNotFoundError(id);
      }

      // Remotes were tried and all failed. Without HTTP-status visibility
      // we cannot tell "truly missing" from "network blip", so surface a
      // generic error and let the caller treat it as transient.
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
    await this.ensureReady();
    let lastError: unknown;
    let localTried = false;
    let localMissed = false;
    let remoteAttempts = 0;
    // Prefer local to avoid network round-trips.
    const ordered = this._local
      ? [this._local, ...this._providers.filter(p => p !== this._local)]
      : this._providers;
    for (const provider of ordered) {
      if (provider === this._local) {
        localTried = true;
      } else {
        remoteAttempts++;
      }
      try {
        return await provider.fetch(id);
      } catch (err) {
        if (provider === this._local) {
          localMissed = true;
        }
        lastError = err;
      }
    }
    // Same logic as resolve(): only flag as definitively missing when no
    // remote providers were available to mask a transient failure.
    if (remoteAttempts === 0 && (localTried ? localMissed : true)) {
      throw new AssetNotFoundError(id);
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

  private logProviderConfiguration(): void {
    const lines: string[] = [
      `[Kritzel] Asset resolver initialized with ${this._providers.length} provider(s):`,
    ];
    for (const provider of this._providers) {
      const role = provider === this._local ? 'local (primary write target)' : provider.type;
      lines.push(`  - ${provider.name} [${role}]`);
    }
    if (this._local) {
      lines.push(`Write strategy: local-first (${this._local.name} → immediate, remote → background queue)`);
    }
    if (this._remoteProviders.length > 0) {
      lines.push(`Remote replication: ${this._remoteProviders.map(p => p.name).join(', ')}`);
    }
    if (this._pending.size > 0) {
      lines.push(`Pending uploads recovered: ${this._pending.size}`);
    }
    console.info(lines.join('\n'));
  }

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
    let recoveredCount = 0;

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
        recoveredCount++;
      }
    }

    if (this.canLogInfo() && recoveredCount > 0) {
      console.info(`[Kritzel] Asset resolver recovered ${recoveredCount} pending upload(s)`);
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
        if (this.canLogInfo()) {
          console.info(`[Kritzel] Asset resolver uploaded ${job.id} to ${provider.name}`);
        }
      } catch (err) {
        job.attempts += 1;
        const delay = Math.min(
          MAX_RETRY_DELAY_MS,
          BASE_RETRY_DELAY_MS * Math.pow(2, job.attempts - 1),
        );
        job.nextAttemptAt = Date.now() + delay;
        nextRetryIn = Math.min(nextRetryIn, delay);
        if (this.canLogInfo()) {
          console.warn(
            `[Kritzel] Asset resolver upload to ${provider.name} failed for ${job.id} (attempt ${job.attempts}). ` +
              `Retrying in ${Math.round(delay / 1000)}s.`,
            err,
          );
        }
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

  /**
   * Returns a promise that resolves once {@link init} has completed.
   *
   * Callers issuing requests before initialization are queued via this
   * promise instead of being rejected. If the resolver is destroyed
   * before init completes, the promise rejects so callers do not hang.
   */
  private ensureReady(): Promise<void> {
    if (this._initialized) return Promise.resolve();
    if (this._destroyed) {
      return Promise.reject(new Error('[KritzelAssetResolver] Resolver was destroyed.'));
    }
    return this.getReadyPromise();
  }

  private getReadyPromise(): Promise<void> {
    if (!this._readyPromise) {
      this._readyPromise = new Promise<void>((resolve, reject) => {
        this._resolveReady = resolve;
        this._rejectReady = reject;
      });
    }
    return this._readyPromise;
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

  private canLogInfo(): boolean {
    return !this._quiet;
  }
}
