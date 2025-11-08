import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

/**
 * Simple BroadcastChannel provider for cross-tab synchronization
 * This is a lightweight alternative to y-webrtc for browser-tab-only sync
 */
export class BroadcastChannelProvider {
  private readonly doc: Y.Doc;
  private readonly channel: BroadcastChannel;
  private _synced: boolean = false;

  constructor(channelName: string, doc: Y.Doc) {
    this.doc = doc;
    this.channel = new BroadcastChannel(channelName);

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

  get synced(): boolean {
    return this._synced;
  }

  destroy() {
    this.doc.off('update', this.handleDocUpdate);
    this.channel.close();
  }
}
