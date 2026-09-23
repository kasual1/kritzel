import { ProviderConfig, ProviderFactory, SyncProviderType } from './sync-provider.interface';

/**
 * Configuration for workspace synchronization providers
 */
export interface KritzelSyncConfig {
  /**
   * Array of provider configurations to enable for synchronization.
   * Can include provider classes directly or factory functions with options.
   * 
   * @example
   * // Simple providers
   * providers: [IndexedDBSyncProvider, BroadcastSyncProvider]
   * 
   * @example
   * // Provider with options using factory
   * providers: [
   *   IndexedDBSyncProvider,
   *   WebSocketSyncProvider.with({ url: 'wss://example.com' })
   * ]
   */
  providers: ProviderConfig[];

  /**
   * Optional shared identifier for the app-state Y.Doc.
   * When provided, this value is used directly as the app-state document identity
   * instead of a browser-local persisted instance id. This enables cross-device
   * synchronization (e.g. via Hocuspocus) where multiple devices must connect
   * to the same app-state document.
   *
   * Derive this from a stable shared identity in your application, such as a
   * user id, account id, or tenant id.
   *
   * When omitted, a locally generated and persisted instance id is used instead,
   * which is stable across reloads on the same browser but not shared across devices.
   */
  appStateId?: string;
}

/**
 * Returns the provider type (`'local'` or `'network'`) for a given provider config entry.
 * Works for both class constructors (via a static `type` property) and
 * factory objects (via an optional `type` property on the factory).
 */
function getProviderConfigType(config: ProviderConfig): SyncProviderType | undefined {
  if (typeof config === 'function') {
    return (config as typeof config & { type?: SyncProviderType }).type;
  }
  return (config as ProviderFactory).type;
}

/**
 * Returns `true` when the given sync configuration contains at least one remote
 * (network) provider, meaning the share option should be available in the UI.
 */
export function hasRemoteSyncProvider(syncConfig?: KritzelSyncConfig): boolean {
  if (!syncConfig?.providers?.length) {
    return false;
  }
  return syncConfig.providers.some(p => getProviderConfigType(p) === 'network');
}
