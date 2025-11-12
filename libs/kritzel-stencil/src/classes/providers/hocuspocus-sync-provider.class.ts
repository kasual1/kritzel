import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { ISyncProvider, ProviderFactory } from '../../interfaces/sync-provider.interface';

/**
 * Options for Hocuspocus sync provider
 */
export interface HocuspocusOptions {
  /**
   * Hocuspocus server URL (optional, defaults to ws://localhost:1234)
   */
  url?: string;

  /**
   * Document name (optional, defaults to docName)
   */
  name?: string;

  /**
   * Authentication token (optional)
   */
  token?: string | (() => string) | (() => Promise<string>);

  /**
   * Quiet mode - suppress console output (optional, defaults to false)
   */
  quiet?: boolean;

  /**
   * Callback when connected (optional)
   */
  onConnect?: () => void;

  /**
   * Callback when disconnected (optional)
   */
  onDisconnect?: () => void;

  /**
   * Callback when synced (optional)
   */
  onSynced?: () => void;

  /**
   * Callback when authentication failed (optional)
   */
  onAuthenticationFailed?: (data: any) => void;

  /**
   * Callback when connection status changes (optional)
   */
  onStatus?: (data: { status: string }) => void;

  /**
   * Force sync interval in milliseconds (optional, false to disable)
   */
  forceSyncInterval?: false | number;

  /**
   * WebSocket polyfill for Node.js environments (optional)
   */
  WebSocketPolyfill?: any;
}

/**
 * Hocuspocus sync provider for real-time collaboration
 */
export class HocuspocusSyncProvider implements ISyncProvider {
  private provider: HocuspocusProvider;
  private isConnected: boolean = false;
  private isSynced: boolean = false;

  constructor(docName: string, doc: Y.Doc, options?: HocuspocusOptions) {
    const url = options?.url || 'ws://localhost:1234';
    const name = options?.name || docName;

    const config: any = {
      url,
      name,
      document: doc,
      token: options?.token || null,
      forceSyncInterval: options?.forceSyncInterval,
      onConnect: () => {
        this.isConnected = true;
        if (!options?.quiet) {
          console.info('Hocuspocus connected');
        }
        options?.onConnect?.();
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.isSynced = false;
        if (!options?.quiet) {
          console.info('Hocuspocus disconnected');
        }
        options?.onDisconnect?.();
      },
      onSynced: () => {
        this.isSynced = true;
        if (!options?.quiet) {
          console.info('Hocuspocus synced');
        }
        options?.onSynced?.();
      },
      onAuthenticationFailed: options?.onAuthenticationFailed,
      onStatus: options?.onStatus,
    };

    // Add WebSocketPolyfill if provided (for Node.js environments)
    if (options?.WebSocketPolyfill) {
      config.WebSocketPolyfill = options.WebSocketPolyfill;
    }

    this.provider = new HocuspocusProvider(config);

    if (!options?.quiet) {
      console.info(`Hocuspocus Provider initialized: ${url}/${name}`);
    }
  }

  /**
   * Static factory method for creating HocuspocusSyncProvider with configuration options
   * Returns a ProviderFactory that can be used in sync configuration
   */
  static with(options?: HocuspocusOptions): ProviderFactory {
    return {
      create: (docName: string, doc: Y.Doc) => {
        return new HocuspocusSyncProvider(docName, doc, options);
      },
    };
  }

  async connect(): Promise<void> {
    if (this.isSynced) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Hocuspocus connection timeout'));
      }, 10000); // 10 second timeout

      const syncHandler = () => {
        clearTimeout(timeout);
        this.provider.off('synced', syncHandler);
        resolve();
      };

      this.provider.on('synced', syncHandler);

      // If already synced, resolve immediately
      if (this.provider.isSynced) {
        clearTimeout(timeout);
        this.provider.off('synced', syncHandler);
        resolve();
        return;
      }

      // Connect if not already connected
      if (!this.isConnected) {
        this.provider.connect();
      }
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.disconnect();
    }
    this.isConnected = false;
    this.isSynced = false;
  }

  destroy(): void {
    if (this.provider) {
      this.provider.destroy();
    }
    this.isConnected = false;
    this.isSynced = false;
  }
}
