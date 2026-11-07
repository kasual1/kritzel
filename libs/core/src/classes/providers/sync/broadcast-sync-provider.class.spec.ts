import * as Y from 'yjs';
import { BroadcastSyncProvider } from './broadcast-sync-provider.class';

/** An in-memory BroadcastChannel: every channel with the same name receives the others' messages. */
class FakeBroadcastChannel {
  static channels = new Set<FakeBroadcastChannel>();
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(readonly name: string) {
    FakeBroadcastChannel.channels.add(this);
  }

  postMessage(data: Uint8Array): void {
    FakeBroadcastChannel.channels.forEach(channel => {
      if (channel !== this && channel.name === this.name) {
        channel.onmessage?.({ data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) });
      }
    });
  }

  close(): void {
    FakeBroadcastChannel.channels.delete(this);
  }
}

describe('BroadcastSyncProvider', () => {
  let originalChannel: unknown;
  const providers: BroadcastSyncProvider[] = [];

  const create = (doc: Y.Doc, options?: { awareness?: boolean }) => {
    const provider = BroadcastSyncProvider.with({ quiet: true, ...options }).create('room', doc) as BroadcastSyncProvider;
    providers.push(provider);
    return provider;
  };

  beforeEach(() => {
    originalChannel = (globalThis as any).BroadcastChannel;
    (globalThis as any).BroadcastChannel = FakeBroadcastChannel;
  });

  afterEach(() => {
    providers.splice(0).forEach(provider => provider.destroy());
    FakeBroadcastChannel.channels.clear();
    (globalThis as any).BroadcastChannel = originalChannel;
  });

  it('syncs document updates between tabs and has no awareness by default', () => {
    const [docA, docB] = [new Y.Doc(), new Y.Doc()];
    const a = create(docA);
    create(docB);

    docA.getMap('objects').set('x', 1);

    expect(docB.getMap('objects').get('x')).toBe(1);
    expect(a.awareness).toBeNull();
    expect(a.type).toBe('local');
  });

  it('shares presence with awareness: true, including with tabs that open later', () => {
    const [docA, docB, docC] = [new Y.Doc(), new Y.Doc(), new Y.Doc()];
    const a = create(docA, { awareness: true });
    const b = create(docB, { awareness: true });

    a.awareness!.setLocalStateField('agents', [{ id: 'writer' }]);
    expect(b.awareness!.getStates().get(docA.clientID)).toEqual({ agents: [{ id: 'writer' }] });

    const c = create(docC, { awareness: true });
    expect(c.awareness!.getStates().get(docA.clientID)).toEqual({ agents: [{ id: 'writer' }] });
  });

  it('takes the presence away while the tab is in the back/forward cache and brings it back', () => {
    const [docA, docB] = [new Y.Doc(), new Y.Doc()];
    const a = create(docA, { awareness: true });
    const b = create(docB, { awareness: true });
    a.awareness!.setLocalStateField('agents', [{ id: 'writer' }]);

    (a as any).handlePageHide({ persisted: true });
    expect(b.awareness!.getStates().has(docA.clientID)).toBe(false);

    (a as any).handlePageShow({ persisted: true });
    expect(b.awareness!.getStates().get(docA.clientID)).toEqual({ agents: [{ id: 'writer' }] });
  });

  it('removes the presence of a tab that is destroyed', () => {
    const [docA, docB] = [new Y.Doc(), new Y.Doc()];
    const a = create(docA, { awareness: true });
    const b = create(docB, { awareness: true });
    a.awareness!.setLocalStateField('user', { id: 'me' });
    expect(b.awareness!.getStates().has(docA.clientID)).toBe(true);

    a.destroy();
    providers.splice(providers.indexOf(a), 1);

    expect(b.awareness!.getStates().has(docA.clientID)).toBe(false);
  });
});
