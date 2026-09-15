import * as Y from 'yjs';
import { WORKSPACE_MIGRATIONS } from './workspace.migrations';

describe('WORKSPACE_MIGRATIONS', () => {
  describe('v2 → v3: KritzelCustomElement renamed to KritzelDynamicObject', () => {
    const migration = WORKSPACE_MIGRATIONS.find(m => m.fromVersion === 2 && m.toVersion === 3)!;

    let ydoc: Y.Doc;
    let objectsMap: Y.Map<any>;

    beforeEach(() => {
      ydoc = new Y.Doc();
      objectsMap = ydoc.getMap('objects');
    });

    it('should be defined', () => {
      expect(migration).toBeDefined();
      expect(migration.fromVersion).toBe(2);
      expect(migration.toVersion).toBe(3);
    });

    it('should rename the __class__ discriminator of top-level objects', () => {
      objectsMap.set('obj-1', { __class__: 'KritzelCustomElement', id: 'obj-1', htmlString: '<div>a</div>' });

      migration.migrate(ydoc, { objects: objectsMap });

      expect(objectsMap.get('obj-1')).toEqual({ __class__: 'KritzelDynamicObject', id: 'obj-1', htmlString: '<div>a</div>' });
    });

    it('should rename nested objects inside serialized groups', () => {
      objectsMap.set('group-1', {
        __class__: 'KritzelGroup',
        id: 'group-1',
        children: [
          { __class__: 'KritzelCustomElement', id: 'child-1' },
          { __class__: 'KritzelPath', id: 'child-2' },
          { __class__: 'KritzelGroup', id: 'child-3', children: [{ __class__: 'KritzelCustomElement', id: 'child-4' }] },
        ],
      });

      migration.migrate(ydoc, { objects: objectsMap });

      const result = objectsMap.get('group-1') as any;
      expect(result.__class__).toBe('KritzelGroup');
      expect(result.children[0].__class__).toBe('KritzelDynamicObject');
      expect(result.children[1].__class__).toBe('KritzelPath');
      expect(result.children[2].children[0].__class__).toBe('KritzelDynamicObject');
    });

    it('should leave unrelated object types untouched', () => {
      const path = { __class__: 'KritzelPath', id: 'obj-1', points: [1, 2, 3] };
      objectsMap.set('obj-1', path);

      migration.migrate(ydoc, { objects: objectsMap });

      expect(objectsMap.get('obj-1')).toEqual(path);
    });

    it('should be idempotent', () => {
      objectsMap.set('obj-1', { __class__: 'KritzelCustomElement', id: 'obj-1' });

      migration.migrate(ydoc, { objects: objectsMap });
      migration.migrate(ydoc, { objects: objectsMap });

      expect(objectsMap.get('obj-1')).toEqual({ __class__: 'KritzelDynamicObject', id: 'obj-1' });
    });

    it('should handle a missing objects map', () => {
      expect(() => migration.migrate(ydoc, {})).not.toThrow();
    });

    it('should handle null and non-object entries', () => {
      objectsMap.set('obj-1', null);
      objectsMap.set('obj-2', 'not-an-object');

      expect(() => migration.migrate(ydoc, { objects: objectsMap })).not.toThrow();
      expect(objectsMap.get('obj-1')).toBeNull();
      expect(objectsMap.get('obj-2')).toBe('not-an-object');
    });

    it('should migrate multiple entries', () => {
      objectsMap.set('obj-1', { __class__: 'KritzelCustomElement', id: 'obj-1' });
      objectsMap.set('obj-2', { __class__: 'KritzelCustomElement', id: 'obj-2' });

      migration.migrate(ydoc, { objects: objectsMap });

      expect((objectsMap.get('obj-1') as any).__class__).toBe('KritzelDynamicObject');
      expect((objectsMap.get('obj-2') as any).__class__).toBe('KritzelDynamicObject');
    });
  });
});
