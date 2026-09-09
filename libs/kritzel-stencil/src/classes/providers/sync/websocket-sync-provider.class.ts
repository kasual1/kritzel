import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { WebsocketProvider } from 'y-websocket';
import { ISyncProvider, ProviderFactory } from '../../../interfaces/sync-provider.interface';

/**
 * Options for WebSocket sync provider
 */
export interface WebSocketOptions {
  /**
   * WebSocket server URL (optional, defaults to ws://localhost:1234)
   */
  url?: string;

  /**
   * Room/document name (optional, defaults to docName)
   */
  roomName?: string;

  /**
   * Connection parameters (optional)
   */
  params?: Record<string, string>;

  /**
   * WebSocket protocols (optional)
   */
  protocols?: string[];

  /**
   * Custom WebSocket constructor (optional, for Node.js environments)
   */
  WebSocketPolyfill?: any;

  /**
   * Awareness protocol options (optional)
   */
  awareness?: any;

  /**
   * Maximum number of connection attempts (optional, defaults to Infinity)
   */
  maxBackoffTime?: number;

  /**
   * Quiet mode - suppress console output (optional, defaults to false)
   */
  quiet?: boolean;
}

/**
 * WebSocket sync provider for real-time collaboration
 */
export class WebSocketSyncProvider implements ISyncProvider {
  static readonly type = 'network' as const;
  readonly type = 'network';
  private provider: WebsocketProvider;
  private isConnected: boolean = false;
  private _quiet: boolean = false;
  private _isSynced: boolean = false;
  private _syncedResolvers: (() => void)[] = [];

  get awareness(): Awareness {
    return this.provider.awareness;
  }

  /** y-websocket applies remote updates with the underlying provider as the Yjs transaction origin. */
  get updateOrigin(): unknown {
    return this.provider;
  }

  constructor(docName: string, doc: Y.Doc, options?: WebSocketOptions) {
    const url = options?.url || 'ws://localhost:1234';
    const roomName = options?.roomName || docName;

    this.provider = new WebsocketProvider(url, roomName, doc, {
      params: options?.params,
      protocols: options?.protocols,
      WebSocketPolyfill: options?.WebSocketPolyfill,
      awareness: options?.awareness,
      maxBackoffTime: options?.maxBackoffTime,
      disableBc: true,
    });

    this._quiet = options?.quiet ?? false;
    this.setupEventListeners();
    if (!this._quiet) {
      console.info(`WebSocket Provider initialized: ${url}/${roomName}`);
    }
  }

  /**
   * Static factory method for creating WebSocketSyncProvider with configuration options
   * Returns a ProviderFactory that can be used in sync configuration
   */
  static with(options?: WebSocketOptions): ProviderFactory {
    return {
      type: 'network',
      create: (docName: string, doc: Y.Doc, runtimeOptions?: { quiet?: boolean }) => {
        const mergedOptions = runtimeOptions ? { ...options, ...runtimeOptions } : options;
        return new WebSocketSyncProvider(docName, doc, mergedOptions);
      },
    };
  }

  private setupEventListeners(): void {
    this.provider.on('status', ({ status }: { status: string }) => {
      if (status === 'connected') {
        this.isConnected = true;
        if (!this._quiet) {
          console.info('WebSocket connected');
        }
      } else if (status === 'disconnected') {
        this.isConnected = false;
        if (!this._quiet) {
          console.info('WebSocket disconnected');
        }
      }
    });

    this.provider.on('sync', (synced: boolean) => {
      if (!synced) {
        return;
      }

      this._isSynced = true;
      this.releaseSyncedWaiters();

      if (!this._quiet) {
        console.info('WebSocket synced');
      }
    });
  }

  private releaseSyncedWaiters(): void {
    const resolvers = this._syncedResolvers;
    this._syncedResolvers = [];
    resolvers.forEach(resolve => resolve());
  }

  async whenSynced(): Promise<void> {
    if (this._isSynced || this.provider.synced) {
      return;
    }

    return new Promise<void>(resolve => {
      this._syncedResolvers.push(resolve);
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout

      const statusHandler = ({ status }: { status: string }) => {
        if (status === 'connected') {
          clearTimeout(timeout);
          this.provider.off('status', statusHandler);
          this.isConnected = true;
          resolve();
        }
      };

      this.provider.on('status', statusHandler);

      // If already connected, resolve immediately
      if (this.provider.wsconnected) {
        clearTimeout(timeout);
        this.provider.off('status', statusHandler);
        this.isConnected = true;
        resolve();
      }
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.disconnect();
    }
    this.isConnected = false;
    this._isSynced = false;
    this.releaseSyncedWaiters();
  }

  async reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  destroy(): void {
    if (this.provider) {
      this.provider.destroy();
    }
    this.isConnected = false;
    this._isSynced = false;
    this.releaseSyncedWaiters();
  }
}
