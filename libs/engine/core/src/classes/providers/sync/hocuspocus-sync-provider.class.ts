import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider';
import { ISyncProvider, ProviderFactory } from '../../../interfaces/sync-provider.interface';

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
   * Callback when connected (optional).
   * Fires on every connection, including reconnections after a disconnect.
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

  /**
   * Timeout in milliseconds for the initial connect() call (optional, defaults to 10000).
   * Note: Even if the timeout fires, the underlying provider continues reconnecting in the background.
   */
  connectionTimeout?: number;

  /**
   * Base delay in milliseconds between reconnect attempts (optional, defaults to 1000)
   */
  delay?: number;

  /**
   * Exponential backoff multiplier for reconnect delay (optional, defaults to 2)
   */
  factor?: number;

  /**
   * Maximum number of reconnect attempts before giving up (optional, defaults to 0 = infinite)
   */
  maxAttempts?: number;

  /**
   * Minimum delay in milliseconds between reconnect attempts (optional)
   */
  minDelay?: number;

  /**
   * Maximum delay in milliseconds between reconnect attempts (optional)
   */
  maxDelay?: number;
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

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'synced';

/**
 * Hocuspocus sync provider for real-time collaboration
 * Supports multiplexing - multiple documents can share the same WebSocket connection
 */
export class HocuspocusSyncProvider implements ISyncProvider {
  static readonly type = 'network' as const;
  readonly type = 'network';
  private provider: HocuspocusProvider;
  private isConnected: boolean = false;
  private isSynced: boolean = false;
  private usesSharedSocket: boolean = false;
  private isDestroyed: boolean = false;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingConnectReject: ((reason?: any) => void) | null = null;
  private connectionTimeoutMs: number;
  private _connectionStatus: ConnectionStatus = 'disconnected';
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;

  get awareness(): Awareness | null {
    return this.provider.awareness;
  }

  get rawProvider(): unknown {
    return this.provider;
  }

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  // Static shared WebSocket instance for multiplexing
  private static sharedWebSocketProvider: HocuspocusProviderWebsocket | null = null;

  constructor(docName: string, doc: Y.Doc, options?: HocuspocusOptions) {
    const name = options?.name || docName;
    const url = options?.url || 'ws://localhost:1234';
    this.connectionTimeoutMs = options?.connectionTimeout ?? 10000;

    // Use provided websocketProvider or the static shared one
    const websocketProvider = options?.websocketProvider || HocuspocusSyncProvider.sharedWebSocketProvider;

    // Build reconnect config from options
    const reconnectConfig: Record<string, unknown> = {};
    if (options?.delay !== undefined) reconnectConfig.delay = options.delay;
    if (options?.factor !== undefined) reconnectConfig.factor = options.factor;
    if (options?.maxAttempts !== undefined) reconnectConfig.maxAttempts = options.maxAttempts;
    if (options?.minDelay !== undefined) reconnectConfig.minDelay = options.minDelay;
    if (options?.maxDelay !== undefined) reconnectConfig.maxDelay = options.maxDelay;

    const onConnect = () => {
      if (this.isDestroyed) {
        return;
      }
      this.isConnected = true;
      this._connectionStatus = 'connected';
      if (!options?.quiet) {
        console.info(`Hocuspocus connected: ${name}`);
      }
      if (options?.onConnect) {
        options.onConnect();
      }
    };

    const onDisconnect = () => {
      if (this.isDestroyed) {
        return;
      }
      this.isConnected = false;
      this.isSynced = false;
      this._connectionStatus = 'disconnected';
      if (!options?.quiet) {
        console.info(`Hocuspocus disconnected: ${name}`);
      }
      if (options?.onDisconnect) {
        options.onDisconnect();
      }
    };

    const onSynced = () => {
      if (this.isDestroyed) {
        return;
      }
      this.isSynced = true;
      this._connectionStatus = 'synced';
      if (!options?.quiet) {
        console.info(`Hocuspocus synced: ${name}`);
      }
      if (options?.onSynced) {
        options.onSynced();
      }
    };

    const onStatus = (data: { status: string }) => {
      if (this.isDestroyed) {
        return;
      }
      if (data.status === 'connecting') {
        this._connectionStatus = 'connecting';
      }
      if (options?.onStatus) {
        options.onStatus(data);
      }
    };

    if (websocketProvider) {
      // Multiplexing mode - use shared WebSocket connection
      this.usesSharedSocket = true;

      const config: Record<string, unknown> = {
        websocketProvider,
        name,
        document: doc,
        token: options?.token || null,
        onStatus,
        onConnect,
        onDisconnect,
        onSynced,
        ...reconnectConfig,
      };

      // Add optional settings
      if (options?.forceSyncInterval !== undefined) {
        config.forceSyncInterval = options.forceSyncInterval;
      }

      if (options?.onAuthenticationFailed) {
        config.onAuthenticationFailed = options.onAuthenticationFailed;
      }

      this.provider = new HocuspocusProvider(config as any);

      // Must call attach() explicitly when using shared socket
      this.provider.attach();

      if (!options?.quiet) {
        console.info(`Hocuspocus Provider initialized (multiplexed): ${name}`);
      }
    } else {
      // Standalone mode - create own WebSocket connection
      this.usesSharedSocket = false;

      const config: Record<string, unknown> = {
        url,
        name,
        document: doc,
        token: options?.token || null,
        autoConnect: false,
        onStatus,
        onConnect,
        onDisconnect,
        onSynced,
        ...reconnectConfig,
      };

      // Add optional settings
      if (options?.forceSyncInterval !== undefined) {
        config.forceSyncInterval = options.forceSyncInterval;
      }

      if (options?.onAuthenticationFailed) {
        config.onAuthenticationFailed = options.onAuthenticationFailed;
      }

      if (options?.WebSocketPolyfill) {
        config.WebSocketPolyfill = options.WebSocketPolyfill;
      }

      this.provider = new HocuspocusProvider(config as any);

      if (!options?.quiet) {
        console.info(`Hocuspocus Provider initialized: ${url}/${name}`);
      }
    }

    this.setupBrowserEventListeners();
  }

  private setupBrowserEventListeners(): void {
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible' && !this.isConnected && !this.isDestroyed) {
          this.provider.connect();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    if (typeof window !== 'undefined') {
      this.onlineHandler = () => {
        if (!this.isConnected && !this.isDestroyed) {
          this.provider.connect();
        }
      };
      window.addEventListener('online', this.onlineHandler);
    }
  }

  private removeBrowserEventListeners(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.onlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
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
      type: 'network',
      create: (docName: string, doc: Y.Doc, runtimeOptions?: { quiet?: boolean }) => {
        const mergedOptions = runtimeOptions ? { ...options, ...runtimeOptions } : options;
        return new HocuspocusSyncProvider(docName, doc, mergedOptions);
      },
    };
  }

  async connect(): Promise<void> {
    if (this.isSynced || this.isDestroyed) {
      return;
    }

    this._connectionStatus = 'connecting';

    return new Promise<void>((resolve, reject) => {
      // Store reject function so we can cancel the connection if destroyed
      this.pendingConnectReject = reject;

      this.connectTimeout = setTimeout(() => {
        this.pendingConnectReject = null;
        this.connectTimeout = null;
        reject(new Error('Hocuspocus connection timeout'));
      }, this.connectionTimeoutMs);

      const syncHandler = () => {
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
        this.pendingConnectReject = null;
        this.provider.off('synced', syncHandler);
        if (!this.isDestroyed) {
          resolve();
        }
      };

      this.provider.on('synced', syncHandler);

      // If already synced, resolve immediately
      if (this.provider.isSynced) {
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
        this.pendingConnectReject = null;
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

  async reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  disconnect(): void {
    // Cancel any pending connection attempt
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    if (this.pendingConnectReject) {
      this.pendingConnectReject = null; // Don't reject, just abandon the promise
    }

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
    this._connectionStatus = 'disconnected';
  }

  destroy(): void {
    // Mark as destroyed first to prevent any callbacks from doing work
    this.isDestroyed = true;

    // Cancel any pending connection attempt
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    if (this.pendingConnectReject) {
      this.pendingConnectReject = null; // Don't reject, just abandon the promise
    }

    this.removeBrowserEventListeners();

    if (this.provider) {
      this.provider.destroy();
    }
    this.isConnected = false;
    this.isSynced = false;
    this._connectionStatus = 'disconnected';
  }
}
