import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { ISyncProvider } from '../../../interfaces/sync-provider.interface';

/**
 * BroadcastChannel sync provider for cross-tab synchronization
 * This is a lightweight alternative to y-webrtc for browser-tab-only sync
 */
export class BroadcastSyncProvider implements ISyncProvider {
  static readonly type = 'local' as const;
  readonly type = 'local';
  private readonly doc: Y.Doc;
  private readonly channel: BroadcastChannel;
  private _synced: boolean = false;

  constructor(docName: string, doc: Y.Doc, _options?: { quiet?: boolean }) {
    this.doc = doc;
    this.channel = new BroadcastChannel(docName);

    // Handle incoming messages from other tabs
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // Listen to document updates and broadcast them
    this.doc.on('update', this.handleDocUpdate);

    // Send initial sync request
    this.broadcastSync();
    
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
      encoding.writeVarUint(encoder, 0); // Message type: sync update
      encoding.writeVarUint8Array(encoder, update);
      this.channel.postMessage(encoding.toUint8Array(encoder));
    }
  };

  private handleMessage(message: ArrayBuffer) {
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case 0: // Sync update
        const update = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(this.doc, update, this);
        break;
      case 1: // Sync request
        this.broadcastSync();
        break;
      case 2: // Sync response
        const stateVector = decoding.readVarUint8Array(decoder);
        const updateResponse = Y.encodeStateAsUpdate(this.doc, stateVector);
        if (updateResponse.length > 0) {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, 0); // Send as regular update
          encoding.writeVarUint8Array(encoder, updateResponse);
          this.channel.postMessage(encoding.toUint8Array(encoder));
        }
        break;
    }
  }

  private broadcastSync() {
    // Broadcast our current state vector to request missing updates
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 2); // Message type: sync response
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
    this.channel.close();
  }
}
