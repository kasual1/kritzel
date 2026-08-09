import { hasRemoteSyncProvider } from './sync-config.interface';
import { IndexedDBSyncProvider } from '../classes/providers/sync/indexeddb-sync-provider.class';
import { BroadcastSyncProvider } from '../classes/providers/sync/broadcast-sync-provider.class';
import { InMemorySyncProvider } from '../classes/providers/sync/in-memory-sync-provider.class';

/** Minimal stub mimicking a class-based network provider */
const NetworkProviderStub = Object.assign(
  class {},
  { providerType: 'network' as const },
) as any;

describe('hasRemoteSyncProvider', () => {
  it('returns false when syncConfig is undefined', () => {
    expect(hasRemoteSyncProvider(undefined)).toBe(false);
  });

  it('returns false when providers array is empty', () => {
    expect(hasRemoteSyncProvider({ providers: [] })).toBe(false);
  });

  it('returns false when only local provider classes are configured', () => {
    expect(hasRemoteSyncProvider({ providers: [IndexedDBSyncProvider, BroadcastSyncProvider, InMemorySyncProvider] })).toBe(false);
  });

  it('returns true when a network provider class is configured', () => {
    expect(hasRemoteSyncProvider({ providers: [NetworkProviderStub] })).toBe(true);
  });

  it('returns true when a network provider factory (with type: "network") is configured', () => {
    const networkFactory = {
      type: 'network' as const,
      create: jest.fn(),
    };
    expect(hasRemoteSyncProvider({ providers: [networkFactory] })).toBe(true);
  });

  it('returns false when a factory without a type property is configured', () => {
    const factoryWithoutType = { create: jest.fn() };
    expect(hasRemoteSyncProvider({ providers: [factoryWithoutType] })).toBe(false);
  });

  it('returns true when mixed local and network providers are configured', () => {
    const networkFactory = { type: 'network' as const, create: jest.fn() };
    expect(hasRemoteSyncProvider({ providers: [IndexedDBSyncProvider, networkFactory] })).toBe(true);
  });
});
