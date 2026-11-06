import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { ISyncProvider, ProviderFactory } from '../../../interfaces/sync-provider.interface';

const MESSAGE_UPDATE = 0;
const MESSAGE_SYNC_REQUEST = 1;
const MESSAGE_SYNC_RESPONSE = 2;
const MESSAGE_AWARENESS = 3;
const MESSAGE_AWARENESS_QUERY = 4;

/** Options of `BroadcastSyncProvider.with()`. */
export interface BroadcastSyncOptions {
  quiet?: boolean;
  /**
   * Shares presence between the tabs too: users' cursors and selections, and agents. Off by default,
   * because tabs of one person are usually not collaborators.
   */
  awareness?: boolean;
}

/**
 * BroadcastChannel sync provider for cross-tab synchronization
 * This is a lightweight alternative to y-webrtc for browser-tab-only sync
 */
export class BroadcastSyncProvider implements ISyncProvider {
  static readonly type = 'local' as const;
  readonly type = 'local';
  /** Presence shared between the tabs, with `awareness: true`. */
  readonly awareness: Awareness | null;
  private readonly doc: Y.Doc;
  private readonly channel: BroadcastChannel;
  private _synced: boolean = false;

  /**
   * A factory for the sync configuration, e.g. `providers: [BroadcastSyncProvider.with({ awareness: true })]`.
   */
  static with(options?: BroadcastSyncOptions): ProviderFactory {
    return {
      type: 'local',
      create: (docName: string, doc: Y.Doc, runtimeOptions?: { quiet?: boolean }) =>
        new BroadcastSyncProvider(docName, doc, runtimeOptions ? { ...options, ...runtimeOptions } : options),
    };
  }

  constructor(docName: string, doc: Y.Doc, _options?: BroadcastSyncOptions) {
    this.doc = doc;
    this.channel = new BroadcastChannel(docName);
    this.awareness = _options?.awareness ? new Awareness(doc) : null;
    if (this.awareness) {
      this.awareness.on('update', this.handleAwarenessUpdate);
      // A tab that closes takes its presence with it.
      if (typeof window !== 'undefined') {
        window.addEventListener('pagehide', this.handlePageHide);
      }
    }

    // Handle incoming messages from other tabs
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // Listen to document updates and broadcast them
    this.doc.on('update', this.handleDocUpdate);

    // Send initial sync request
    this.broadcastSync();
    if (this.awareness) {
      this.post(MESSAGE_AWARENESS_QUERY);
    }
    
    // Mark as synced after a short delay (to receive any pending updates)
    setTimeout(() => {
      this._synced = true;
    }, 100);

    if (!_options?.quiet) {
      console.info(`BroadcastChannel Provider initialized: ${docName}`);
    }
  }

  private handleDocUpdate = (update: Uint8Array, origin: any) => {
    // Don't broadcast updates that came from other tabs (to prevent loops)
    if (origin !== this) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_UPDATE);
      encoding.writeVarUint8Array(encoder, update);
      this.channel.postMessage(encoding.toUint8Array(encoder));
    }
  };

  private handleAwarenessUpdate = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    // Only share what changed here, never echo what another tab sent.
    if (origin === this || !this.awareness) {
      return;
    }
    this.postAwareness([...added, ...updated, ...removed]);
  };

  private handlePageHide = () => {
    if (this.awareness) {
      removeAwarenessStates(this.awareness, [this.doc.clientID], 'pagehide');
    }
  };

  private postAwareness(clients: number[]) {
    if (!this.awareness || clients.length === 0) {
      return;
    }
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(this.awareness, clients));
    this.channel.postMessage(encoding.toUint8Array(encoder));
  }

  private post(messageType: number) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageType);
    this.channel.postMessage(encoding.toUint8Array(encoder));
  }

  private handleMessage(message: ArrayBuffer) {
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_UPDATE: {
        const update = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(this.doc, update, this);
        break;
      }
      case MESSAGE_AWARENESS:
        if (this.awareness) {
          applyAwarenessUpdate(this.awareness, decoding.readVarUint8Array(decoder), this);
        }
        break;
      case MESSAGE_AWARENESS_QUERY:
        // A new tab asks for everyone's presence: answer with our own state.
        if (this.awareness?.getLocalState() !== null && this.awareness) {
          this.postAwareness([this.doc.clientID]);
        }
        break;
      case MESSAGE_SYNC_REQUEST:
        this.broadcastSync();
        break;
      case MESSAGE_SYNC_RESPONSE: {
        const stateVector = decoding.readVarUint8Array(decoder);
        const updateResponse = Y.encodeStateAsUpdate(this.doc, stateVector);
        if (updateResponse.length > 0) {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_UPDATE); // Send as regular update
          encoding.writeVarUint8Array(encoder, updateResponse);
          this.channel.postMessage(encoding.toUint8Array(encoder));
        }
        break;
      }
    }
  }

  private broadcastSync() {
    // Broadcast our current state vector to request missing updates
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC_RESPONSE);
    encoding.writeVarUint8Array(encoder, Y.encodeStateVector(this.doc));
    this.channel.postMessage(encoding.toUint8Array(encoder));
  }

  async connect(): Promise<void> {
    // Wait for initial sync to complete
    if (this._synced) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      const checkSync = () => {
        if (this._synced) {
          resolve();
        } else {
          setTimeout(checkSync, 50);
        }
      };
      checkSync();
    });
  }

  disconnect(): void {
    // BroadcastChannel doesn't have explicit disconnect
  }

  async reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  destroy(): void {
    this.doc.off('update', this.handleDocUpdate);
    if (this.awareness) {
      // Tell the other tabs before the channel closes.
      removeAwarenessStates(this.awareness, [this.doc.clientID], 'destroy');
      this.awareness.off('update', this.handleAwarenessUpdate);
      this.awareness.destroy();
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', this.handlePageHide);
      }
    }
    this.channel.close();
  }
}
