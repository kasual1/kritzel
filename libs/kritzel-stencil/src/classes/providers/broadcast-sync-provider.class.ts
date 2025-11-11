import * as Y from 'yjs';
import { BroadcastChannelProvider } from '../core/broadcast-channel-provider.class';
import { ISyncProvider } from '../../interfaces/sync-provider.interface';

/**
 * BroadcastChannel sync provider for cross-tab synchronization
 */
export class BroadcastSyncProvider implements ISyncProvider {
  private provider: BroadcastChannelProvider;
  private isConnected: boolean = false;

  constructor(docName: string, doc: Y.Doc, _options?: any) {
    this.provider = new BroadcastChannelProvider(docName, doc);
    console.info(`BroadcastChannel Provider initialized: ${docName}`);
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    // BroadcastChannel connects immediately
    this.isConnected = true;
  }

  disconnect(): void {
    // BroadcastChannel doesn't have explicit disconnect
    this.isConnected = false;
  }

  destroy(): void {
    if (this.provider) {
      this.provider.destroy();
    }
    this.isConnected = false;
  }
}
