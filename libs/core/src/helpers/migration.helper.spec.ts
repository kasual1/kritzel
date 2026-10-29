import * as Y from 'yjs';
import { runMigrations } from './migration.helper';
import { KritzelMigration } from '../interfaces/migration.interface';

describe('runMigrations', () => {
  let ydoc: Y.Doc;
  let metadataMap: Y.Map<any>;
  let dataMap: Y.Map<any>;

  beforeEach(() => {
    ydoc = new Y.Doc();
    metadataMap = ydoc.getMap('metadata');
    dataMap = ydoc.getMap('data');
  });

  afterEach(() => {
    ydoc.destroy();
  });

  it('should not run migrations when document version equals current version', () => {
    metadataMap.set('schemaVersion', 3);
    const migrateFn = jest.fn();
    const migrations: KritzelMigration[] = [{ fromVersion: 2, toVersion: 3, migrate: migrateFn }];

    const result = runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 3);

    expect(result).toEqual({ migrated: false, fromVersion: 3, toVersion: 3 });
    expect(migrateFn).not.toHaveBeenCalled();
  });

  it('should not run migrations when document version exceeds current version', () => {
    metadataMap.set('schemaVersion', 5);
    const migrateFn = jest.fn();
    const migrations: KritzelMigration[] = [{ fromVersion: 4, toVersion: 5, migrate: migrateFn }];

    const result = runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 3);

    expect(result).toEqual({ migrated: false, fromVersion: 5, toVersion: 5 });
    expect(migrateFn).not.toHaveBeenCalled();
  });

  it('should default to version 0 when no schemaVersion is set', () => {
    const migrateFn = jest.fn();
    const migrations: KritzelMigration[] = [{ fromVersion: 0, toVersion: 1, migrate: migrateFn }];

    const result = runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 1);

    expect(result).toEqual({ migrated: true, fromVersion: 0, toVersion: 1 });
    expect(migrateFn).toHaveBeenCalledTimes(1);
  });

  it('should execute migrations in order', () => {
    const executionOrder: number[] = [];

    const migrations: KritzelMigration[] = [
      { fromVersion: 1, toVersion: 2, migrate: () => executionOrder.push(2) },
      { fromVersion: 0, toVersion: 1, migrate: () => executionOrder.push(1) },
      { fromVersion: 2, toVersion: 3, migrate: () => executionOrder.push(3) },
    ];

    const result = runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 3);

    expect(result).toEqual({ migrated: true, fromVersion: 0, toVersion: 3 });
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('should only run pending migrations (skip already-applied ones)', () => {
    metadataMap.set('schemaVersion', 2);
    const skip1 = jest.fn();
    const skip2 = jest.fn();
    const run3 = jest.fn();

    const migrations: KritzelMigration[] = [
      { fromVersion: 0, toVersion: 1, migrate: skip1 },
      { fromVersion: 1, toVersion: 2, migrate: skip2 },
      { fromVersion: 2, toVersion: 3, migrate: run3 },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 3);

    expect(skip1).not.toHaveBeenCalled();
    expect(skip2).not.toHaveBeenCalled();
    expect(run3).toHaveBeenCalledTimes(1);
  });

  it('should update schemaVersion in metadata after running migrations', () => {
    const migrations: KritzelMigration[] = [
      { fromVersion: 0, toVersion: 1, migrate: jest.fn() },
      { fromVersion: 1, toVersion: 2, migrate: jest.fn() },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 2);

    expect(metadataMap.get('schemaVersion')).toBe(2);
  });

  it('should stamp current version even when migration list is empty', () => {
    const result = runMigrations(ydoc, metadataMap, { data: dataMap }, [], 3);

    expect(result).toEqual({ migrated: true, fromVersion: 0, toVersion: 3 });
    expect(metadataMap.get('schemaVersion')).toBe(3);
  });

  it('should use migration transaction origin', () => {
    const transactSpy = jest.spyOn(ydoc, 'transact');

    runMigrations(ydoc, metadataMap, { data: dataMap }, [], 1);

    expect(transactSpy).toHaveBeenCalledWith(expect.any(Function), 'migration');
  });

  it('should pass ydoc and maps to each migration function', () => {
    const migrateFn = jest.fn();
    const migrations: KritzelMigration[] = [{ fromVersion: 0, toVersion: 1, migrate: migrateFn }];
    const maps = { data: dataMap };

    runMigrations(ydoc, metadataMap, maps, migrations, 1);

    expect(migrateFn).toHaveBeenCalledWith(ydoc, maps);
  });

  it('should not exceed the target version', () => {
    const run1 = jest.fn();
    const run2 = jest.fn();
    const skip3 = jest.fn();

    const migrations: KritzelMigration[] = [
      { fromVersion: 0, toVersion: 1, migrate: run1 },
      { fromVersion: 1, toVersion: 2, migrate: run2 },
      { fromVersion: 2, toVersion: 3, migrate: skip3 },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 2);

    expect(run1).toHaveBeenCalled();
    expect(run2).toHaveBeenCalled();
    expect(skip3).not.toHaveBeenCalled();
    expect(metadataMap.get('schemaVersion')).toBe(2);
  });

  it('should actually transform data in Yjs maps', () => {
    dataMap.set('item-1', { name: 'old', value: 10 });

    const migrations: KritzelMigration[] = [
      {
        fromVersion: 0,
        toVersion: 1,
        migrate: (_ydoc, maps) => {
          maps.data.forEach((value: any, key: string) => {
            if (!value.migrated) {
              maps.data.set(key, { ...value, migrated: true, value: value.value * 2 });
            }
          });
        },
      },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 1);

    expect(dataMap.get('item-1')).toEqual({ name: 'old', value: 20, migrated: true });
  });

  it('should handle idempotent migrations safely', () => {
    dataMap.set('item-1', { name: 'test' });

    const idempotentMigration: KritzelMigration = {
      fromVersion: 0,
      toVersion: 1,
      migrate: (_ydoc, maps) => {
        maps.data.forEach((value: any, key: string) => {
          if (!value.newField) {
            maps.data.set(key, { ...value, newField: 'default' });
          }
        });
      },
    };

    // Run twice to verify idempotency
    runMigrations(ydoc, metadataMap, { data: dataMap }, [idempotentMigration], 1);

    // Reset version to simulate concurrent client
    metadataMap.set('schemaVersion', 0);
    runMigrations(ydoc, metadataMap, { data: dataMap }, [idempotentMigration], 1);

    expect(dataMap.get('item-1')).toEqual({ name: 'test', newField: 'default' });
  });

  it('should log migration progress when quiet is false', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const migrations: KritzelMigration[] = [
      { fromVersion: 0, toVersion: 1, migrate: jest.fn() },
      { fromVersion: 1, toVersion: 2, migrate: jest.fn() },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 2, { quiet: false });

    expect(consoleSpy).toHaveBeenCalledWith('[Kritzel] Running 2 migration(s) from v0 to v2');
    expect(consoleSpy).toHaveBeenCalledWith('[Kritzel] Migrating v0 → v1');
    expect(consoleSpy).toHaveBeenCalledWith('[Kritzel] Migrating v1 → v2');
    expect(consoleSpy).toHaveBeenCalledWith('[Kritzel] Migrations complete. Schema now at v2');

    consoleSpy.mockRestore();
  });

  it('should not log migration progress when quiet is true', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const migrations: KritzelMigration[] = [
      { fromVersion: 0, toVersion: 1, migrate: jest.fn() },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 1, { quiet: true });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should default to quiet when no options are provided', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const migrations: KritzelMigration[] = [
      { fromVersion: 0, toVersion: 1, migrate: jest.fn() },
    ];

    runMigrations(ydoc, metadataMap, { data: dataMap }, migrations, 1);

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
