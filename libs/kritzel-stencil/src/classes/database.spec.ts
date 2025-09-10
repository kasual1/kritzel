import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { KritzelDatabase } from './database.class';

describe('KritzelDatabase', () => {
  let _database: KritzelDatabase;
  const dbName = 'TestDB';
  const dbVersion = 1;

  beforeEach(async () => {
    _database = new KritzelDatabase(dbName, dbVersion);
    await _database.open([
      {
        name: 'objects',
        options: { keyPath: ['workspaceId', 'id'] },
        indices: [{ name: 'workspaceId_idx', keyPath: 'workspaceId', options: { unique: false } }],
      },
      { name: 'workspaces', options: { keyPath: 'id' } },
    ]);
  });

  afterEach(() => {
    _database.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('should open and close the database', async () => {
    expect(_database).toBeDefined();
    _database.close();
    await expect(_database.add('workspaces', { id: '1', name: 'test' })).rejects.toThrow('Database is not open.');
  });

  it('should add and get an item from a store', async () => {
    const workspace = { id: 'ws1', name: 'My Workspace' };
    await _database.add('workspaces', workspace);

    const retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toEqual(workspace);
  });

  it('should add and get an item with a compound key', async () => {
    const object = { workspaceId: 'ws1', id: 'obj1', data: 'some data' };
    await _database.add('objects', object);

    const retrieved = await _database.get('objects', ['ws1', 'obj1']);
    expect(retrieved).toEqual(object);
  });

  it('should get all items from a store', async () => {
    const workspace1 = { id: 'ws1', name: 'Workspace 1' };
    const workspace2 = { id: 'ws2', name: 'Workspace 2' };
    await _database.add('workspaces', workspace1);
    await _database.add('workspaces', workspace2);

    const allWorkspaces = await _database.getAll('workspaces');
    expect(allWorkspaces).toHaveLength(2);
    expect(allWorkspaces).toContainEqual(workspace1);
    expect(allWorkspaces).toContainEqual(workspace2);
  });

  it('should update an item in a store', async () => {
    const workspace = { id: 'ws1', name: 'Initial Name' };
    await _database.add('workspaces', workspace);

    const updatedWorkspace = { id: 'ws1', name: 'Updated Name' };
    await _database.update('workspaces', updatedWorkspace);

    const retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toEqual(updatedWorkspace);
  });

  it('should delete an item from a store', async () => {
    const workspace = { id: 'ws1', name: 'To be deleted' };
    await _database.add('workspaces', workspace);

    let retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toBeDefined();

    await _database.delete('workspaces', 'ws1');

    retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toBeUndefined();
  });

  it('should delete an item from a store with multiple items', async () => {
    const workspace1 = { id: 'ws1', name: 'Workspace 1' };
    const workspace2 = { id: 'ws2', name: 'Workspace 2' };
    await _database.add('workspaces', workspace1);
    await _database.add('workspaces', workspace2);

    let retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toBeDefined();

    await _database.delete('workspaces', 'ws1');

    retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toBeUndefined();

    const remaining = await _database.getAll('workspaces');
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toEqual(workspace2);
  });
  

  it('should get all items by index', async () => {
    const obj1 = { workspaceId: 'ws1', id: 'obj1', data: 'data1' };
    const obj2 = { workspaceId: 'ws1', id: 'obj2', data: 'data2' };
    const obj3 = { workspaceId: 'ws2', id: 'obj3', data: 'data3' };

    await _database.add('objects', obj1);
    await _database.add('objects', obj2);
    await _database.add('objects', obj3);

    const ws1Objects = await _database.getAllByIndex('objects', 'workspaceId_idx', 'ws1');
    expect(ws1Objects).toHaveLength(2);
    expect(ws1Objects).toContainEqual(obj1);
    expect(ws1Objects).toContainEqual(obj2);
  });

  it('should perform a custom transaction', async () => {
    const workspace1 = { id: 'ws1', name: 'Workspace 1' };
    const workspace2 = { id: 'ws2', name: 'Workspace 2' };

    await _database.transaction(['workspaces'], 'readwrite', workspacesStore => {
      workspacesStore.add(workspace1);
      workspacesStore.add(workspace2);
    });

    const allWorkspaces = await _database.getAll('workspaces');
    expect(allWorkspaces).toHaveLength(2);
  });

  it('should throw an error when database is not open', async () => {
    _database.close();
    await expect(_database.get('workspaces', 'some-key')).rejects.toThrow('Database is not open.');
  });
});