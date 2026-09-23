import * as Y from 'yjs';
import { InMemorySyncProvider } from './in-memory-sync-provider.class';

describe('InMemorySyncProvider', () => {
  beforeEach(() => {
    InMemorySyncProvider.clear();
  });

  describe('connect()', () => {
    it('should resolve without error when no cached state exists', async () => {
      const doc = new Y.Doc();
      const provider = new InMemorySyncProvider('test-doc', doc);

      await expect(provider.connect()).resolves.toBeUndefined();

      provider.destroy();
      doc.destroy();
    });

    it('should leave the doc empty when no cached state exists', async () => {
      const doc = new Y.Doc();
      const provider = new InMemorySyncProvider('test-doc', doc);

      await provider.connect();

      expect(doc.getMap('objects').size).toBe(0);

      provider.destroy();
      doc.destroy();
    });

    it('should apply cached state to a new doc on connect', async () => {
      const docA = new Y.Doc();
      const providerA = new InMemorySyncProvider('test-doc', docA);
      await providerA.connect();

      docA.getMap('objects').set('item-1', 'value-1');
      providerA.destroy();
      docA.destroy();

      const docB = new Y.Doc();
      const providerB = new InMemorySyncProvider('test-doc', docB);
      await providerB.connect();

      expect(docB.getMap('objects').get('item-1')).toBe('value-1');

      providerB.destroy();
      docB.destroy();
    });

    it('should be a no-op if already connected', async () => {
      const doc = new Y.Doc();
      const provider = new InMemorySyncProvider('test-doc', doc);

      await provider.connect();
      doc.getMap('objects').set('item-1', 'value-1');

      // Second connect should not duplicate or overwrite anything
      await provider.connect();

      expect(doc.getMap('objects').get('item-1')).toBe('value-1');
      expect(doc.getMap('objects').size).toBe(1);

      provider.destroy();
      doc.destroy();
    });
  });

  describe('cache isolation', () => {
    it('should not share state between different docNames', async () => {
      const docA = new Y.Doc();
      const providerA = new InMemorySyncProvider('doc-a', docA);
      await providerA.connect();
      docA.getMap('objects').set('item-a', 'value-a');
      providerA.destroy();
      docA.destroy();

      const docB = new Y.Doc();
      const providerB = new InMemorySyncProvider('doc-b', docB);
      await providerB.connect();

      expect(docB.getMap('objects').get('item-a')).toBeUndefined();

      providerB.destroy();
      docB.destroy();
    });

    it('should share state between different docNames when options.name is the same', async () => {
      const docA = new Y.Doc();
      const providerA = new InMemorySyncProvider('doc-a', docA, { name: 'shared-key' });
      await providerA.connect();
      docA.getMap('objects').set('item-1', 'value-1');
      providerA.destroy();
      docA.destroy();

      const docB = new Y.Doc();
      const providerB = new InMemorySyncProvider('doc-b', docB, { name: 'shared-key' });
      await providerB.connect();

      expect(docB.getMap('objects').get('item-1')).toBe('value-1');

      providerB.destroy();
      docB.destroy();
    });
  });

  describe('destroy()', () => {
    it('should stop updating the cache after destroy', async () => {
      const docA = new Y.Doc();
      const providerA = new InMemorySyncProvider('test-doc', docA);
      await providerA.connect();
      docA.getMap('objects').set('item-1', 'value-1');
      providerA.destroy();

      // Mutation after destroy — should NOT be reflected in the cache
      docA.getMap('objects').set('item-2', 'value-2');
      docA.destroy();

      const docB = new Y.Doc();
      const providerB = new InMemorySyncProvider('test-doc', docB);
      await providerB.connect();

      expect(docB.getMap('objects').get('item-1')).toBe('value-1');
      expect(docB.getMap('objects').get('item-2')).toBeUndefined();

      providerB.destroy();
      docB.destroy();
    });
  });

  describe('reconnect()', () => {
    it('should re-apply the current cache on reconnect', async () => {
      const doc = new Y.Doc();
      const provider = new InMemorySyncProvider('test-doc', doc);
      await provider.connect();

      doc.getMap('objects').set('item-1', 'value-1');
      provider.disconnect();

      // Mutation while disconnected — not tracked, not cached
      doc.getMap('objects').set('item-2', 'value-2');

      await provider.reconnect();

      // item-1 was in the cache before disconnect, so it persists
      expect(doc.getMap('objects').get('item-1')).toBe('value-1');

      provider.destroy();
      doc.destroy();
    });
  });

  describe('static clear()', () => {
    it('should clear a single cache entry by name', async () => {
      const docA = new Y.Doc();
      const providerA = new InMemorySyncProvider('doc-a', docA);
      await providerA.connect();
      docA.getMap('objects').set('item-a', 'value-a');
      providerA.destroy();
      docA.destroy();

      const docB = new Y.Doc();
      const providerB = new InMemorySyncProvider('doc-b', docB);
      await providerB.connect();
      docB.getMap('objects').set('item-b', 'value-b');
      providerB.destroy();
      docB.destroy();

      InMemorySyncProvider.clear('doc-a');

      const freshDocA = new Y.Doc();
      const freshProviderA = new InMemorySyncProvider('doc-a', freshDocA);
      await freshProviderA.connect();
      expect(freshDocA.getMap('objects').get('item-a')).toBeUndefined();
      freshProviderA.destroy();
      freshDocA.destroy();

      const freshDocB = new Y.Doc();
      const freshProviderB = new InMemorySyncProvider('doc-b', freshDocB);
      await freshProviderB.connect();
      expect(freshDocB.getMap('objects').get('item-b')).toBe('value-b');
      freshProviderB.destroy();
      freshDocB.destroy();
    });

    it('should clear all cache entries when called without arguments', async () => {
      const docA = new Y.Doc();
      const providerA = new InMemorySyncProvider('doc-a', docA);
      await providerA.connect();
      docA.getMap('objects').set('item-a', 'value-a');
      providerA.destroy();
      docA.destroy();

      const docB = new Y.Doc();
      const providerB = new InMemorySyncProvider('doc-b', docB);
      await providerB.connect();
      docB.getMap('objects').set('item-b', 'value-b');
      providerB.destroy();
      docB.destroy();

      InMemorySyncProvider.clear();

      const freshDocA = new Y.Doc();
      const freshProviderA = new InMemorySyncProvider('doc-a', freshDocA);
      await freshProviderA.connect();
      expect(freshDocA.getMap('objects').get('item-a')).toBeUndefined();
      freshProviderA.destroy();
      freshDocA.destroy();

      const freshDocB = new Y.Doc();
      const freshProviderB = new InMemorySyncProvider('doc-b', freshDocB);
      await freshProviderB.connect();
      expect(freshDocB.getMap('objects').get('item-b')).toBeUndefined();
      freshProviderB.destroy();
      freshDocB.destroy();
    });
  });
});
