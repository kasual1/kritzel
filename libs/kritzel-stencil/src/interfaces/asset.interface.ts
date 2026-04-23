/**
 * Kinds of assets that can be stored via an asset storage provider.
 * Images are the primary consumer today; other kinds are reserved so a
 * single provider infrastructure can serve future object types.
 */
export type KritzelAssetKind = 'image' | 'video' | 'audio' | 'file';

/**
 * Describes a stored binary asset.
 * Only the `id` is persisted inside the Yjs document on Kritzel objects;
 * all other fields are metadata carried by the asset layer.
 */
export interface KritzelAsset {
  /** Stable identifier (uuid). Persisted inside canvas objects. */
  id: string;
  /** Coarse kind used to dispatch consumers. */
  kind: KritzelAssetKind;
  /** MIME type of the stored bytes (e.g. `image/png`). */
  mimeType: string;
  /** Size of the stored bytes in bytes. */
  size: number;
  /** Creation timestamp (ms since epoch). */
  createdAt: number;
  /** Optional width hint (pixels) for visual assets. */
  width?: number;
  /** Optional height hint (pixels) for visual assets. */
  height?: number;
  /** Optional duration hint (milliseconds) for time-based assets. */
  durationMs?: number;
  /** Optional original filename as supplied by the user. */
  originalFilename?: string;
  /**
   * Names of remote providers that have not yet successfully received a
   * copy of this asset. When non-empty, the resolver will keep retrying
   * the upload in the background. Empty / undefined means the asset is
   * fully replicated (or no remote providers are configured).
   */
  pendingRemotes?: string[];
}

/**
 * Lifecycle state used by consumers (e.g. the renderer) to react to
 * in-flight asset resolution without having to poll.
 */
export type KritzelAssetLoadState = 'idle' | 'loading' | 'ready' | 'error';
