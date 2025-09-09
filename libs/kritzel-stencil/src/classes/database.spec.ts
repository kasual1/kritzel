import 'fake-indexeddb/auto';
import { KritzelDatabase } from './database.class';

describe('KritzelDatabase', () => {
  let db: KritzelDatabase;
  const dbName = 'testDB';
  const storeName = 'testStore';

  beforeEach(() => {
    db = new KritzelDatabase(dbName, 1);
  });

  afterEach(async () => {
    indexedDB.deleteDatabase(dbName);
  });

  it('should open a database with the specified stores', async () => {
    await db.open([{ name: storeName }]);
    // The open method resolves when the database is ready.
    // No need for an explicit assertion here, if it doesn't throw, it's a success.
  });

  it('should add an item to the store', async () => {
    await db.open([{ name: storeName, options: { keyPath: 'id' } }]);
    const item = { id: 1, name: 'test' };
    const key = await db.add(storeName, item);
    expect(key).toBe(1);
  });

  it('should get an item from the store', async () => {
    await db.open([{ name: storeName, options: { keyPath: 'id' } }]);
    const item = { id: 1, name: 'test' };
    await db.add(storeName, item);
    const result = await db.get(storeName, 1);
    expect(result).toEqual(item);
  });

  it('should get all items from the store', async () => {
    await db.open([{ name: storeName, options: { keyPath: 'id' } }]);
    const item1 = { id: 1, name: 'test1' };
    const item2 = { id: 2, name: 'test2' };
    await db.add(storeName, item1);
    await db.add(storeName, item2);
    const results = await db.getAll(storeName);
    expect(results).toEqual([item1, item2]);
  });

  it('should update an item in the store', async () => {
    await db.open([{ name: storeName, options: { keyPath: 'id' } }]);
    const item = { id: 1, name: 'test' };
    await db.add(storeName, item);
    const updatedItem = { id: 1, name: 'updated' };
    await db.update(storeName, updatedItem);
    const result = await db.get(storeName, 1);
    expect(result).toEqual(updatedItem);
  });

  it('should delete an item from the store', async () => {
    await db.open([{ name: storeName, options: { keyPath: 'id' } }]);
    const item = { id: 1, name: 'test' };
    await db.add(storeName, item);
    await db.delete(storeName, 1);
    const result = await db.get(storeName, 1);
    expect(result).toBeUndefined();
  });

  it('should perform a transaction', async () => {
    await db.open([
      { name: 'store1', options: { keyPath: 'id' } },
      { name: 'store2', options: { keyPath: 'id' } },
    ]);
    const item1 = { id: 1, data: 'store1data' };
    const item2 = { id: 1, data: 'store2data' };

    await db.transaction(['store1', 'store2'], 'readwrite', (store1, store2) => {
      store1.add(item1);
      store2.add(item2);
    });

    const result1 = await db.get('store1', 1);
    const result2 = await db.get('store2', 1);

    expect(result1).toEqual(item1);
    expect(result2).toEqual(item2);
  });

  
});
