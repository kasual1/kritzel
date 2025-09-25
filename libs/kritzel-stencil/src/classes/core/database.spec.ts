import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { KritzelDatabase } from './database.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelSerializable } from '../../interfaces/serializable.interface';

export class MockObject implements KritzelSerializable {
  __class__: string = 'MockObject';

  constructor(
    public id: string,
    public workspaceId: string,
    public name: string
  ) {}

  deserialize(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }

  serialize() {
    return {
      __class__: this.__class__,
      id: this.id,
      workspaceId: this.workspaceId,
      name: this.name,
    };
  }

  static deserialize(data: any): MockObject {
    return new MockObject(data.id, data.workspaceId, data.name);
  }
}

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
    const workspace = new KritzelWorkspace('1', 'test');
    await expect(_database.add('workspaces', workspace)).rejects.toThrow('Database is not open.');
  });

  it('should add and get an item from a store', async () => {
    const workspace = new KritzelWorkspace('ws1', 'Workspace 1');
    await _database.add('workspaces', workspace);

    const retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toEqual(workspace);
  });

  it('should add and get an item with a compound key', async () => {
    const object = new MockObject('obj1', 'ws1', 'data1');
    await _database.add('objects', object);

    const retrieved = await _database.get('objects', ['ws1', 'obj1']);
    expect(retrieved).toEqual(object);
  });

  it('should get all items from a store', async () => {
    const workspace1 = new KritzelWorkspace('ws1', 'Workspace 1');
    const workspace2 = new KritzelWorkspace('ws2', 'Workspace 2');
    await _database.add('workspaces', workspace1);
    await _database.add('workspaces', workspace2);

    const allWorkspaces = await _database.getAll('workspaces');
    expect(allWorkspaces).toHaveLength(2);
    expect(allWorkspaces).toContainEqual(workspace1);
    expect(allWorkspaces).toContainEqual(workspace2);
  });

  it('should update an item in a store', async () => {
    const workspace = new KritzelWorkspace('ws1', 'Initial Name');
    await _database.add('workspaces', workspace);

    const updatedWorkspace = new KritzelWorkspace('ws1', 'Updated Name');
    await _database.update('workspaces', updatedWorkspace);

    const retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toEqual(updatedWorkspace);
  });

  it('should delete an item from a store', async () => {
    const workspace = new KritzelWorkspace('ws1', 'To be deleted');
    await _database.add('workspaces', workspace);

    let retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toBeDefined();

    await _database.delete('workspaces', 'ws1');

    retrieved = await _database.get('workspaces', 'ws1');
    expect(retrieved).toBeUndefined();
  });

  it('should delete an item from a store with multiple items', async () => {
    const workspace1 = new KritzelWorkspace('ws1', 'Workspace 1');
    const workspace2 = new KritzelWorkspace('ws2', 'Workspace 2');
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
    const obj1 = new MockObject('obj1', 'ws1', 'data1');
    const obj2 = new MockObject('obj2', 'ws1', 'data2');
    const obj3 = new MockObject('obj3', 'ws2', 'data3');

    await _database.add('objects', obj1);
    await _database.add('objects', obj2);
    await _database.add('objects', obj3);

    const ws1Objects = await _database.getAllByIndex('objects', 'workspaceId_idx', 'ws1');
    expect(ws1Objects).toHaveLength(2);
    expect(ws1Objects).toContainEqual(obj1);
    expect(ws1Objects).toContainEqual(obj2);
  });

  it('should perform a batch of operations', async () => {
    const workspace = new MockObject('ws1', 'workspace', 'Workspace 1');
    const object = new MockObject('obj1', 'ws1', 'some data');

    const results = await _database.batch([
      db => db.add('workspaces', workspace),
      db => db.add('objects', object),
      db => db.get('workspaces', 'ws1'),
      db => db.get('objects', ['ws1', 'obj1']),
    ]);
    expect(results[2]).toEqual(workspace);
    expect(results[3]).toEqual(object);
  });

  it('should throw an error when database is not open', async () => {
    _database.close();
    await expect(_database.get('workspaces', 'some-key')).rejects.toThrow('Database is not open.');
  });
});