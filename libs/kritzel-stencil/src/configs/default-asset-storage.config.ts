import { KritzelAssetStorageConfig } from '../interfaces/asset-storage-config.interface';

/**
 * Default asset storage configuration. Stores bytes in IndexedDB only,
 * which provides offline-friendly behavior out of the box. Applications
 * that sync Yjs over the network should also configure a remote provider
 * (e.g. HttpAssetProvider) so images are available across devices.
 */
export const DEFAULT_ASSET_STORAGE_CONFIG: KritzelAssetStorageConfig = {
  providers: [],
};
