import { AssetProviderConfig } from './asset-provider.interface';

/**
 * Configuration for the asset storage layer used by Kritzel to store
 * binary payloads (images, etc.) outside of the Yjs CRDT.
 *
 * The Yjs document only stores asset ids; the actual bytes live in the
 * providers configured here. This keeps CRDT updates tiny regardless of
 * attachment size.
 *
 * @example Local-only (offline friendly):
 * ```ts
 * { providers: [IndexedDBAssetProvider] }
 * ```
 *
 * @example Write-through to a REST backend with IDB cache:
 * ```ts
 * {
 *   providers: [
 *     IndexedDBAssetProvider,
 *     HttpAssetProvider.with({
 *       uploadUrl: () => '/api/assets',
 *       resolveUrl: (id) => `/api/assets/${id}`,
 *       headers: async () => ({ Authorization: `Bearer ${await getToken()}` }),
 *     }),
 *   ],
 * }
 * ```
 */
export interface KritzelAssetStorageConfig {
  /**
   * Ordered list of asset providers. Resolution walks the list in order
   * and returns the first provider that can serve a given id (typically
   * the local cache first, then the remote authority).
   *
   * For uploads, the resolver writes to every provider in a write-through
   * fashion: local providers receive the bytes immediately; remote
   * providers are written via a persistent background queue.
   */
  providers: AssetProviderConfig[];
}
