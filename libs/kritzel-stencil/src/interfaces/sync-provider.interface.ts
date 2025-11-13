import * as Y from 'yjs';

/**
 * Interface for sync providers that handle data synchronization across different mediums
 * (IndexedDB, BroadcastChannel, WebSocket, etc.)
 */
export interface ISyncProvider {
  /**
   * Initialize and connect the provider
   */
  connect(): Promise<void>;

  /**
   * Disconnect the provider (can be reconnected later)
   */
  disconnect(): void;

  /**
   * Destroy the provider and clean up all resources
   */
  destroy(): void;
}

/**
 * Factory function type for creating provider instances
 */
export interface ProviderFactory {
  create(docName: string, doc: Y.Doc): ISyncProvider;
}

/**
 * Type for provider configuration - either a class constructor or a factory
 */
export type ProviderConfig = (new (docName: string, doc: Y.Doc, options?: any) => ISyncProvider) | ProviderFactory;
