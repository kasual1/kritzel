import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/**
 * Distinguishes local-only providers (IndexedDB, BroadcastChannel) from
 * network providers (WebSocket, Hocuspocus) that require a server connection.
 */
export type SyncProviderType = 'local' | 'network';

/**
 * Interface for sync providers that handle data synchronization across different mediums
 * (IndexedDB, BroadcastChannel, WebSocket, etc.)
 */
export interface ISyncProvider {
  /**
   * Whether this provider operates locally or over the network.
   * Local providers resolve quickly and are awaited during initialization.
   * Network providers connect in the background so they don't block the editor.
   */
  readonly type: SyncProviderType;

  /**
   * The Yjs Awareness instance for this provider, if supported.
   * Network providers (WebSocket, Hocuspocus) return an Awareness instance;
   * local-only providers (IndexedDB, BroadcastChannel) return null or undefined.
   */
  readonly awareness?: Awareness | null;

  /**
   * Initialize and connect the provider
   */
  connect(): Promise<void>;

  /**
   * Disconnect the provider (can be reconnected later)
   */
  disconnect(): void;

  /**
   * Disconnect and reconnect the provider.
   * Useful for recovering from stale connections after network changes or tab visibility restore.
   */
  reconnect(): Promise<void>;

  /**
   * Destroy the provider and clean up all resources
   */
  destroy(): void;
}

/**
 * Factory function type for creating provider instances
 */
export interface ProviderFactory {
  /**
   * Whether this factory creates local or network providers.
   * Used to determine UI capabilities such as the share option.
   */
  readonly type?: SyncProviderType;
  create(docName: string, doc: Y.Doc, options?: { quiet?: boolean }): ISyncProvider;
}

/**
 * Type for provider configuration - either a class constructor or a factory
 */
export type ProviderConfig = (new (docName: string, doc: Y.Doc, options?: any) => ISyncProvider) | ProviderFactory;
