import { IDBKeyRange as FakeIDBKeyRange, indexedDB as fakeIndexedDB } from 'fake-indexeddb';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as legacyIndexedDb from './legacy-indexeddb';
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
async function seedYjsDatabase(name: string, objectId: string, className = 'KritzelPath'): Promise<void> {
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(name, doc);
  await persistence.whenSynced;
  doc.getMap('objects').set(objectId, { __class__: className, id: objectId });
  await persistence.destroy();
  doc.destroy();
}

/** Opens a y-indexeddb database, lets `change` edit its document and stores the result. */
async function editYjsDatabase(name: string, change: (objects: Y.Map<unknown>) => void): Promise<void> {
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(name, doc);
  await persistence.whenSynced;
  change(doc.getMap('objects'));
  await persistence.destroy();
  doc.destroy();
}

/** Copies a y-indexeddb database to a new name, as Updraw did when it imported a Kritzel database. */
async function copyYjsDatabase(from: string, to: string): Promise<void> {
  const source = new Y.Doc();
  const sourcePersistence = new IndexeddbPersistence(from, source);
  await sourcePersistence.whenSynced;
  const target = new Y.Doc();
  const targetPersistence = new IndexeddbPersistence(to, target);
  await targetPersistence.whenSynced;
  Y.applyUpdate(target, Y.encodeStateAsUpdate(source));
  await sourcePersistence.destroy();
  await targetPersistence.destroy();
  source.destroy();
  target.destroy();
}

/** Creates an asset database with the layout `IndexedDBAssetProvider` uses and one record. */
async function seedAssetDatabase(name: string, id: string, size = 3): Promise<void> {
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
    tx.objectStore('metadata').put({ id, kind: 'image', mimeType: 'image/png', size, createdAt: 1 }, id);
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

    it('imports a Kritzel database again that Updraw already imported, because markers are per current name', async () => {
      if (!globalThis.localStorage) {
        return;
      }
      const legacyName = `kritzel-workspace-${uniqueId()}`;
      await seedYjsDatabase(legacyName, 'p1');
      // The marker Updraw wrote when it imported this database into its own.
      globalThis.localStorage.setItem(`updraw-legacy-import:${legacyName}`, '1');
      const doc = new Y.Doc();

      expect(isLegacyDatabaseImported(legacyName)).toBe(false);
      expect(await importLegacyIndexedDbDocument(legacyName, doc)).toBe(true);

      expect(doc.getMap('objects').get('p1')).toEqual({ __class__: 'KritzelPath', id: 'p1' });
      expect(globalThis.localStorage.getItem(`upmade-legacy-import:${legacyName}`)).not.toBeNull();
    });
  });

  describe('IndexedDBSyncProvider', () => {
    it.each([
      ['updraw', 'UpdrawPath'],
      ['kritzel', 'KritzelPath'],
    ])('loads a document saved under its %s name and persists it under the new name', async (brand, className) => {
      const id = uniqueId();
      await seedYjsDatabase(`${brand}-workspace-${id}`, 'p1', className);

      const doc = new Y.Doc();
      const provider = new IndexedDBSyncProvider(`upmade-workspace-${id}`, doc);
      await provider.connect();
      expect(doc.getMap('objects').get('p1')).toEqual({ __class__: className, id: 'p1' });
      provider.destroy();

      // Remove the legacy database: the content must now come from the new one.
      await deleteDatabase(`${brand}-workspace-${id}`);
      const reloaded = new Y.Doc();
      const reloadedProvider = new IndexedDBSyncProvider(`upmade-workspace-${id}`, reloaded);
      await reloadedProvider.connect();
      expect(reloaded.getMap('objects').get('p1')).toEqual({ __class__: className, id: 'p1' });
      reloadedProvider.destroy();
    });

    it('merges both the updraw and the kritzel database, editor-scoped names included', async () => {
      const id = uniqueId();
      await seedYjsDatabase(`updraw-workspace-homepage-${id}`, 'p-updraw', 'UpdrawPath');
      await seedYjsDatabase(`kritzel-workspace-homepage-${id}`, 'p-kritzel', 'KritzelPath');

      const doc = new Y.Doc();
      const provider = new IndexedDBSyncProvider(`upmade-workspace-homepage-${id}`, doc);
      await provider.connect();

      expect(doc.getMap('objects').toJSON()).toEqual({
        'p-updraw': { __class__: 'UpdrawPath', id: 'p-updraw' },
        'p-kritzel': { __class__: 'KritzelPath', id: 'p-kritzel' },
      });
      if (globalThis.localStorage) {
        expect(isLegacyDatabaseImported(`updraw-workspace-homepage-${id}`)).toBe(true);
        expect(isLegacyDatabaseImported(`kritzel-workspace-homepage-${id}`)).toBe(true);
      }
      provider.destroy();
    });

    it('keeps Updraw-era edits of a document Updraw imported from Kritzel, without duplicating content', async () => {
      const id = uniqueId();
      await seedYjsDatabase(`kritzel-workspace-${id}`, 'p1');
      await editYjsDatabase(`kritzel-workspace-${id}`, objects => objects.set('p2', { __class__: 'KritzelPath', id: 'p2' }));
      // Updraw imported the Kritzel database, then the user deleted p1 and added p3.
      await copyYjsDatabase(`kritzel-workspace-${id}`, `updraw-workspace-${id}`);
      await editYjsDatabase(`updraw-workspace-${id}`, objects => {
        objects.delete('p1');
        objects.set('p3', { __class__: 'UpdrawPath', id: 'p3' });
      });

      const doc = new Y.Doc();
      const provider = new IndexedDBSyncProvider(`upmade-workspace-${id}`, doc);
      await provider.connect();

      // The Kritzel database still holds p1, but merging it does not bring the deleted object back.
      expect(doc.getMap('objects').toJSON()).toEqual({
        p2: { __class__: 'KritzelPath', id: 'p2' },
        p3: { __class__: 'UpdrawPath', id: 'p3' },
      });
      provider.destroy();
    });

    it('still imports the kritzel database when the updraw one cannot be read', async () => {
      const id = uniqueId();
      await seedYjsDatabase(`kritzel-workspace-${id}`, 'p1');
      const importDocument = jest.spyOn(legacyIndexedDb, 'importLegacyIndexedDbDocument');
      importDocument.mockRejectedValueOnce(new Error('unreadable'));
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      try {
        const doc = new Y.Doc();
        const provider = new IndexedDBSyncProvider(`upmade-workspace-${id}`, doc);
        await provider.connect();

        expect(importDocument.mock.calls.map(([name]) => name)).toEqual([`updraw-workspace-${id}`, `kritzel-workspace-${id}`]);
        expect(doc.getMap('objects').get('p1')).toEqual({ __class__: 'KritzelPath', id: 'p1' });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`updraw-workspace-${id}`), expect.any(Error));
        provider.destroy();
      } finally {
        importDocument.mockRestore();
        warn.mockRestore();
      }
    });

    it('does not import anything when a custom database name is set', async () => {
      const id = uniqueId();
      await seedYjsDatabase(`updraw-workspace-${id}`, 'p1', 'UpdrawPath');
      await seedYjsDatabase(`kritzel-workspace-${id}`, 'p2');

      const doc = new Y.Doc();
      const provider = new IndexedDBSyncProvider(`upmade-workspace-${id}`, doc, { name: `custom-${id}` });
      await provider.connect();

      expect(doc.getMap('objects').size).toBe(0);
      provider.destroy();
    });
  });

  describe('IndexedDBAssetProvider', () => {
    afterEach(async () => {
      await deleteDatabase('updraw-assets');
      await deleteDatabase('kritzel-assets');
      await deleteDatabase('upmade-assets');
    });

    it.each(['updraw-assets', 'kritzel-assets'])('copies assets from the legacy default database %s', async legacyDbName => {
      await seedAssetDatabase(legacyDbName, 'asset-1');

      const provider = new IndexedDBAssetProvider();
      await provider.init();

      expect(provider.canResolve('asset-1')).toBe(true);
      expect(await provider.getMetadata('asset-1')).toEqual(expect.objectContaining({ id: 'asset-1', mimeType: 'image/png' }));
      expect(await databaseNames()).toContain(legacyDbName);
      provider.destroy();
    });

    it('copies the assets of both legacy databases, taking an asset in both from updraw-assets', async () => {
      await seedAssetDatabase('updraw-assets', 'shared', 30);
      await seedAssetDatabase('updraw-assets', 'updraw-only');
      await seedAssetDatabase('kritzel-assets', 'shared', 10);
      await seedAssetDatabase('kritzel-assets', 'kritzel-only');

      const provider = new IndexedDBAssetProvider();
      await provider.init();

      expect(provider.canResolve('updraw-only')).toBe(true);
      expect(provider.canResolve('kritzel-only')).toBe(true);
      expect(await provider.getMetadata('shared')).toEqual(expect.objectContaining({ size: 30 }));
      if (globalThis.localStorage) {
        expect(isLegacyDatabaseImported('updraw-assets')).toBe(true);
        expect(isLegacyDatabaseImported('kritzel-assets')).toBe(true);
      }
      provider.destroy();
    });

    it('does not copy into a custom database', async () => {
      await seedAssetDatabase('updraw-assets', 'asset-2');
      await seedAssetDatabase('kritzel-assets', 'asset-1');

      const provider = new IndexedDBAssetProvider({ dbName: `custom-assets-${uniqueId()}` });
      await provider.init();

      expect(provider.canResolve('asset-1')).toBe(false);
      expect(provider.canResolve('asset-2')).toBe(false);
      provider.destroy();
    });
  });
});
