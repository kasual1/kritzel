import { ProviderConfig } from './sync-provider.interface';

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
}
