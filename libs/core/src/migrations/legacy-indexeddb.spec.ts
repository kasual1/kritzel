import { IDBKeyRange as FakeIDBKeyRange, indexedDB as fakeIndexedDB } from 'fake-indexeddb';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { importLegacyIndexedDbDocument, indexedDbExists, isLegacyDatabaseImported } from './legacy-indexeddb';
import { IndexedDBSyncProvider } from '../classes/providers/sync/indexeddb-sync-provider.class';
import { IndexedDBAssetProvider } from '../classes/providers/assets/indexeddb-asset-provider.class';

// Stencil's test environment keeps `window` apart from the global scope, so register the fakes on the global itself.
Object.assign(globalThis, { indexedDB: fakeIndexedDB, IDBKeyRange: FakeIDBKeyRange });

let dbCounter = 0;
/** Unique id per test, so tests never share databases or import markers. */
const uniqueId = () => `t${Date.now().toString(36)}${dbCounter++}`;

const databaseNames = async (): Promise<string[]> => (await indexedDB.databases()).map(database => database.name ?? '');

/** Writes a Yjs document with one object into a y-indexeddb database. */
async function seedYjsDatabase(name: string, objectId: string): Promise<void> {
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(name, doc);
  await persistence.whenSynced;
  doc.getMap('objects').set(objectId, { __class__: 'KritzelPath', id: objectId });
  await persistence.destroy();
  doc.destroy();
}

/** Creates an asset database with the layout `IndexedDBAssetProvider` uses and one record. */
async function seedAssetDatabase(name: string, id: string): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('blobs');
      request.result.createObjectStore('metadata');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['blobs', 'metadata'], 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    // A typed array stands in for a Blob, which Node's structured clone cannot copy.
    tx.objectStore('blobs').put(new Uint8Array([1, 2, 3]), id);
    tx.objectStore('metadata').put({ id, kind: 'image', mimeType: 'image/png', size: 3, createdAt: 1 }, id);
  });
  db.close();
}

const deleteDatabase = (name: string) =>
  new Promise<void>(resolve => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });

describe('legacy IndexedDB import', () => {
  beforeEach(() => {
    try {
      globalThis.localStorage?.clear();
    } catch {
      // no storage in this environment
    }
  });

  describe('indexedDbExists', () => {
    it('detects an existing database', async () => {
      const name = `exists-${uniqueId()}`;
      await seedYjsDatabase(name, 'p1');
      expect(await indexedDbExists(name)).toBe(true);
    });

    it('returns false for a missing database without creating it', async () => {
      const name = `missing-${uniqueId()}`;
      expect(await indexedDbExists(name)).toBe(false);
      expect(await databaseNames()).not.toContain(name);
    });

    it('does not create the database when it has to probe by opening it', async () => {
      const name = `probe-${uniqueId()}`;
      const databases = indexedDB.databases;
      (indexedDB as any).databases = undefined;
      try {
        expect(await indexedDbExists(name)).toBe(false);
      } finally {
        (indexedDB as any).databases = databases;
      }
      expect(await databaseNames()).not.toContain(name);

      await seedYjsDatabase(name, 'p1');
      (indexedDB as any).databases = undefined;
      try {
        expect(await indexedDbExists(name)).toBe(true);
      } finally {
        (indexedDB as any).databases = databases;
      }
    });
  });

  describe('importLegacyIndexedDbDocument', () => {
    it('merges the legacy document and leaves the legacy database in place', async () => {
      const legacyName = `kritzel-workspace-${uniqueId()}`;
      await seedYjsDatabase(legacyName, 'p1');
      const doc = new Y.Doc();

      expect(await importLegacyIndexedDbDocument(legacyName, doc)).toBe(true);

      expect(doc.getMap('objects').get('p1')).toEqual({ __class__: 'KritzelPath', id: 'p1' });
      expect(await databaseNames()).toContain(legacyName);
    });

    it('returns false when there is no legacy database', async () => {
      const doc = new Y.Doc();
      expect(await importLegacyIndexedDbDocument(`kritzel-workspace-${uniqueId()}`, doc)).toBe(false);
      expect(doc.getMap('objects').size).toBe(0);
    });

    it('does not record the import in the undo history', async () => {
      const legacyName = `kritzel-workspace-${uniqueId()}`;
      await seedYjsDatabase(legacyName, 'p1');
      const doc = new Y.Doc();
      const undoManager = new Y.UndoManager(doc.getMap('objects'), { trackedOrigins: new Set(['local', 'temporary']) });

      await importLegacyIndexedDbDocument(legacyName, doc);

      expect(undoManager.undoStack.length).toBe(0);
    });

    it('remembers a completed import when storage is available', async () => {
      if (!globalThis.localStorage) {
        return;
      }
      const legacyName = `kritzel-workspace-${uniqueId()}`;
      await seedYjsDatabase(legacyName, 'p1');

      await importLegacyIndexedDbDocument(legacyName, new Y.Doc());

      expect(isLegacyDatabaseImported(legacyName)).toBe(true);
      expect(await importLegacyIndexedDbDocument(legacyName, new Y.Doc())).toBe(false);
    });
  });

  describe('IndexedDBSyncProvider', () => {
    it('loads a document saved under its legacy name and persists it under the new name', async () => {
      const id = uniqueId();
      await seedYjsDatabase(`kritzel-workspace-${id}`, 'p1');

      const doc = new Y.Doc();
      const provider = new IndexedDBSyncProvider(`updraw-workspace-${id}`, doc);
      await provider.connect();
      expect(doc.getMap('objects').get('p1')).toEqual({ __class__: 'KritzelPath', id: 'p1' });
      provider.destroy();

      // Remove the legacy database: the content must now come from the new one.
      await deleteDatabase(`kritzel-workspace-${id}`);
      const reloaded = new Y.Doc();
      const reloadedProvider = new IndexedDBSyncProvider(`updraw-workspace-${id}`, reloaded);
      await reloadedProvider.connect();
      expect(reloaded.getMap('objects').get('p1')).toEqual({ __class__: 'KritzelPath', id: 'p1' });
      reloadedProvider.destroy();
    });

    it('does not import anything when a custom database name is set', async () => {
      const id = uniqueId();
      await seedYjsDatabase(`kritzel-workspace-${id}`, 'p1');

      const doc = new Y.Doc();
      const provider = new IndexedDBSyncProvider(`updraw-workspace-${id}`, doc, { name: `custom-${id}` });
      await provider.connect();

      expect(doc.getMap('objects').size).toBe(0);
      provider.destroy();
    });
  });

  describe('IndexedDBAssetProvider', () => {
    afterEach(async () => {
      await deleteDatabase('kritzel-assets');
      await deleteDatabase('updraw-assets');
    });

    it('copies assets from the legacy default database', async () => {
      await seedAssetDatabase('kritzel-assets', 'asset-1');

      const provider = new IndexedDBAssetProvider();
      await provider.init();

      expect(provider.canResolve('asset-1')).toBe(true);
      expect(await provider.getMetadata('asset-1')).toEqual(expect.objectContaining({ id: 'asset-1', mimeType: 'image/png' }));
      expect(await databaseNames()).toContain('kritzel-assets');
      provider.destroy();
    });

    it('does not copy into a custom database', async () => {
      await seedAssetDatabase('kritzel-assets', 'asset-1');

      const provider = new IndexedDBAssetProvider({ dbName: `custom-assets-${uniqueId()}` });
      await provider.init();

      expect(provider.canResolve('asset-1')).toBe(false);
      provider.destroy();
    });
  });
});
