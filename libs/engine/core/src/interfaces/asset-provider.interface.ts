import { KritzelAsset } from './asset.interface';

/**
 * Distinguishes local-only asset providers (IndexedDB) from network providers
 * (HTTP, presigned S3, etc.) that replicate assets across devices.
 */
export type AssetProviderType = 'local' | 'remote';

/**
 * Metadata supplied when uploading a new asset. The provider is free to
 * use or ignore hints (e.g. width/height) but MUST persist `mimeType`.
 */
export interface KritzelAssetPutMetadata {
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  originalFilename?: string;
  kind?: KritzelAsset['kind'];
  /**
   * Optional pre-assigned asset id. When provided, the provider should
   * use this id instead of generating one. This allows the resolver to
   * coordinate ids across a write-through (local + remote) pipeline.
   */
  id?: string;
}

/**
 * Contract every asset storage provider implements.
 *
 * Providers are pluggable and may be combined in a chain (see AssetResolver).
 * Local providers (e.g. IndexedDB) are always-on and serve as a cache and
 * offline buffer. Remote providers replicate assets across devices so the
 * Yjs CRDT can stay small (it only stores the asset id, not the bytes).
 */
export interface IAssetStorageProvider {
  /** Whether this provider stores bytes locally or over the network. */
  readonly type: AssetProviderType;

  /** Human-readable provider name used in logs / diagnostics. */
  readonly name: string;

  /**
   * Initializes the provider. Called once by the resolver before first use.
   * Local providers typically open an IDB connection here; remote providers
   * may perform a health check or no-op.
   */
  init(): Promise<void>;

  /**
   * Destroys the provider and releases any held resources.
   */
  destroy(): void;

  /**
   * Returns true if this provider is capable of resolving the given asset id.
   * Remote providers usually return true unconditionally (they don't know
   * without a round-trip); local providers may return true only when the
   * asset is actually cached.
   */
  canResolve(id: string): boolean | Promise<boolean>;

  /**
   * Persists the given bytes and returns the resulting asset descriptor.
   * If `metadata.id` is provided, the provider MUST use that id.
   */
  put(blob: Blob, metadata: KritzelAssetPutMetadata): Promise<KritzelAsset>;

  /**
   * Returns a URL usable directly as an `<img src>` / `<video src>`.
   * Local providers typically return a `blob:` URL; remote providers return
   * an HTTPS URL (possibly signed).
   */
  resolve(id: string): Promise<string>;

  /**
   * Returns the raw bytes for the given asset. Used for export flows that
   * need to embed the bytes (e.g. SVG export with inline images).
   */
  fetch(id: string): Promise<Blob>;

  /**
   * Optional deletion support. Providers without deletion (e.g. immutable
   * CDNs) may omit this.
   */
  delete?(id: string): Promise<void>;
}

/**
 * Factory function type for creating asset provider instances.
 * Mirrors the shape used by sync providers for consistency.
 */
export interface AssetProviderFactory {
  create(): IAssetStorageProvider;
}

/**
 * Configuration value accepted by `KritzelAssetStorageConfig.providers`:
 * either a zero-arg class constructor or a factory object.
 */
export type AssetProviderConfig = (new () => IAssetStorageProvider) | AssetProviderFactory;
