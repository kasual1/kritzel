import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider';
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
   * Shared WebSocket provider for multiplexing (optional)
   * If provided, multiple documents will share the same WebSocket connection
   */
  websocketProvider?: HocuspocusProviderWebsocket;

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
 * Options for creating a shared WebSocket connection
 */
export interface HocuspocusWebSocketOptions {
  /**
   * Hocuspocus server URL
   */
  url: string;

  /**
   * WebSocket polyfill for Node.js environments (optional)
   */
  WebSocketPolyfill?: any;

  /**
   * Callback when WebSocket connects (optional)
   */
  onConnect?: () => void;

  /**
   * Callback when WebSocket disconnects (optional)
   */
  onDisconnect?: () => void;

  /**
   * Callback when connection status changes (optional)
   */
  onStatus?: (data: { status: string }) => void;
}

/**
 * Hocuspocus sync provider for real-time collaboration
 * Supports multiplexing - multiple documents can share the same WebSocket connection
 */
export class HocuspocusSyncProvider implements ISyncProvider {
  private provider: HocuspocusProvider;
  private isConnected: boolean = false;
  private isSynced: boolean = false;
  private usesSharedSocket: boolean = false;

  get awareness(): Awareness {
    return this.provider.awareness;
  }

  // Static shared WebSocket instance for multiplexing
  private static sharedWebSocketProvider: HocuspocusProviderWebsocket | null = null;

  constructor(docName: string, doc: Y.Doc, options?: HocuspocusOptions) {
    const name = options?.name || docName;
    const url = options?.url || 'ws://localhost:1234';

    // Use provided websocketProvider or the static shared one
    const websocketProvider = options?.websocketProvider || HocuspocusSyncProvider.sharedWebSocketProvider;

    if (websocketProvider) {
      // Multiplexing mode - use shared WebSocket connection
      this.usesSharedSocket = true;

      const config: any = {
        websocketProvider,
        name,
        document: doc,
        token: options?.token || null,
        onConnect: () => {
          if (this.isConnected) {
            return;
          }
          this.isConnected = true;
          if (!options?.quiet) {
            console.info(`Hocuspocus connected: ${name}`);
          }
          if (options?.onConnect) {
            options.onConnect();
          }
        },
        onDisconnect: () => {
          if (!this.isConnected && !this.isSynced) {
            return;
          }
          this.isConnected = false;
          this.isSynced = false;
          if (!options?.quiet) {
            console.info(`Hocuspocus disconnected: ${name}`);
          }
          if (options?.onDisconnect) {
            options.onDisconnect();
          }
        },
        onSynced: () => {
          if (this.isSynced) {
            return;
          }
          this.isSynced = true;
          if (!options?.quiet) {
            console.info(`Hocuspocus synced: ${name}`);
          }
          if (options?.onSynced) {
            options.onSynced();
          }
        },
      };

      // Add optional settings
      if (options?.forceSyncInterval !== undefined) {
        config.forceSyncInterval = options.forceSyncInterval;
      }

      if (options?.onAuthenticationFailed) {
        config.onAuthenticationFailed = options.onAuthenticationFailed;
      }

      if (options?.onStatus) {
        config.onStatus = options.onStatus;
      }

      this.provider = new HocuspocusProvider(config);

      // Must call attach() explicitly when using shared socket
      this.provider.attach();

      if (!options?.quiet) {
        console.info(`Hocuspocus Provider initialized (multiplexed): ${name}`);
      }
    } else {
      // Standalone mode - create own WebSocket connection
      this.usesSharedSocket = false;

      const config: any = {
        url,
        name,
        document: doc,
        token: options?.token || null,
        onConnect: () => {
          if (this.isConnected) {
            return;
          }
          this.isConnected = true;
          if (!options?.quiet) {
            console.info(`Hocuspocus connected: ${name}`);
          }
          if (options?.onConnect) {
            options.onConnect();
          }
        },
        onDisconnect: () => {
          if (!this.isConnected && !this.isSynced) {
            return;
          }
          this.isConnected = false;
          this.isSynced = false;
          if (!options?.quiet) {
            console.info(`Hocuspocus disconnected: ${name}`);
          }
          if (options?.onDisconnect) {
            options.onDisconnect();
          }
        },
        onSynced: () => {
          if (this.isSynced) {
            return;
          }
          this.isSynced = true;
          if (!options?.quiet) {
            console.info(`Hocuspocus synced: ${name}`);
          }
          if (options?.onSynced) {
            options.onSynced();
          }
        },
      };

      // Add optional settings
      if (options?.forceSyncInterval !== undefined) {
        config.forceSyncInterval = options.forceSyncInterval;
      }

      if (options?.onAuthenticationFailed) {
        config.onAuthenticationFailed = options.onAuthenticationFailed;
      }

      if (options?.onStatus) {
        config.onStatus = options.onStatus;
      }

      if (options?.WebSocketPolyfill) {
        config.WebSocketPolyfill = options.WebSocketPolyfill;
      }

      this.provider = new HocuspocusProvider(config);

      if (!options?.quiet) {
        console.info(`Hocuspocus Provider initialized: ${url}/${name}`);
      }
    }
  }

  /**
   * Create a shared WebSocket connection for multiplexing
   * Call this once to create a shared connection that multiple providers can use
   */
  static createSharedWebSocket(options: HocuspocusWebSocketOptions): HocuspocusProviderWebsocket {
    if (HocuspocusSyncProvider.sharedWebSocketProvider) {
      console.warn('Shared WebSocket already exists. Returning existing instance.');
      return HocuspocusSyncProvider.sharedWebSocketProvider;
    }

    const config: any = {
      url: options.url,
    };

    if (options.WebSocketPolyfill) {
      config.WebSocketPolyfill = options.WebSocketPolyfill;
    }

    if (options.onConnect) {
      config.onConnect = options.onConnect;
    }

    if (options.onDisconnect) {
      config.onDisconnect = options.onDisconnect;
    }

    if (options.onStatus) {
      config.onStatus = options.onStatus;
    }

    HocuspocusSyncProvider.sharedWebSocketProvider = new HocuspocusProviderWebsocket(config);
    console.info(`Shared Hocuspocus WebSocket created: ${options.url}`);

    return HocuspocusSyncProvider.sharedWebSocketProvider;
  }

  /**
   * Destroy the shared WebSocket connection
   * Call this when you're done with all multiplexed providers
   */
  static destroySharedWebSocket(): void {
    if (HocuspocusSyncProvider.sharedWebSocketProvider) {
      HocuspocusSyncProvider.sharedWebSocketProvider.destroy();
      HocuspocusSyncProvider.sharedWebSocketProvider = null;
      console.info('Shared Hocuspocus WebSocket destroyed');
    }
  }

  /**
   * Get the shared WebSocket provider instance (if it exists)
   */
  static getSharedWebSocket(): HocuspocusProviderWebsocket | null {
    return HocuspocusSyncProvider.sharedWebSocketProvider;
  }

  /**
   * Static factory method for creating HocuspocusSyncProvider with configuration options
   * Returns a ProviderFactory that can be used in sync configuration
   */
  static with(options?: HocuspocusOptions): ProviderFactory {
    return {
      create: (docName: string, doc: Y.Doc, runtimeOptions?: { quiet?: boolean }) => {
        const mergedOptions = runtimeOptions ? { ...options, ...runtimeOptions } : options;
        return new HocuspocusSyncProvider(docName, doc, mergedOptions);
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

      // Connect if not already connected (standalone mode only)
      if (!this.isConnected && !this.usesSharedSocket) {
        this.provider.connect();
      }
    });
  }

  disconnect(): void {
    if (this.provider) {
      if (this.usesSharedSocket) {
        // Detach from shared socket instead of disconnecting
        this.provider.detach();
      } else {
        this.provider.disconnect();
      }
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
