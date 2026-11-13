import * as Y from 'yjs';
import {
  isLegacyClassName,
  LEGACY_STORAGE_KEYS,
  migrateLegacyStorageKeys,
  normalizeLegacyClassName,
  toLegacyDocumentName,
} from './legacy-brand';
import { runMigrations } from '../helpers/migration.helper';
import { WORKSPACE_MIGRATIONS } from './workspace.migrations';
import { UpdrawReviver } from '../classes/core/reviver.class';
import { UpdrawPath } from '../classes/objects/path.class';
import { UpdrawGroup } from '../classes/objects/group.class';
import { UpdrawDynamicObject } from '../classes/objects/dynamic-object.class';
import { UpdrawWorkspace } from '../classes/core/workspace.class';
import { UpdrawBrushTool } from '../classes/tools/brush-tool.class';
import { getClipboardPayloadJson } from '../classes/managers/clipboard.types';
import legacyWorkspace from '../__fixtures__/legacy-workspace.json';

/** Minimal in-memory Storage. */
class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.has(key) ? this.items.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.items.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, String(value));
  }
}

const createCore = (): any => ({
  store: {
    currentZIndex: 0,
    state: { activeWorkspace: { id: 'workspace-1' } },
  },
  user: undefined,
});

describe('legacy brand compatibility', () => {
  describe('normalizeLegacyClassName', () => {
    it('maps legacy class names to the current prefix', () => {
      expect(normalizeLegacyClassName('KritzelPath')).toBe('UpdrawPath');
      expect(normalizeLegacyClassName('KritzelWorkspace')).toBe('UpdrawWorkspace');
      expect(normalizeLegacyClassName('KritzelBrushTool')).toBe('UpdrawBrushTool');
    });

    it('maps the pre-v3 custom element class to the dynamic object class', () => {
      expect(normalizeLegacyClassName('KritzelCustomElement')).toBe('UpdrawDynamicObject');
    });

    it('leaves current and unknown class names unchanged', () => {
      expect(normalizeLegacyClassName('UpdrawPath')).toBe('UpdrawPath');
      expect(normalizeLegacyClassName('MyCustomObject')).toBe('MyCustomObject');
      expect(normalizeLegacyClassName('')).toBe('');
    });

    it('detects legacy class names', () => {
      expect(isLegacyClassName('KritzelPath')).toBe(true);
      expect(isLegacyClassName('UpdrawPath')).toBe(false);
      expect(isLegacyClassName(undefined)).toBe(false);
    });
  });

  describe('toLegacyDocumentName', () => {
    it('returns the pre-rename name of default document names', () => {
      expect(toLegacyDocumentName('updraw-workspace-abc')).toBe('kritzel-workspace-abc');
      expect(toLegacyDocumentName('updraw-app-state-editor-1-uuid')).toBe('kritzel-app-state-editor-1-uuid');
      expect(toLegacyDocumentName('updraw-assets')).toBe('kritzel-assets');
    });

    it('returns null for names without the updraw- prefix', () => {
      expect(toLegacyDocumentName('my-room')).toBeNull();
      expect(toLegacyDocumentName('kritzel-workspace-abc')).toBeNull();
    });
  });

  describe('migrateLegacyStorageKeys', () => {
    let storage: MemoryStorage;

    beforeEach(() => {
      storage = new MemoryStorage();
    });

    it('copies every legacy key, including editor-scoped keys, and keeps the legacy keys', () => {
      storage.setItem('kritzel-settings', '{"theme":"dark"}');
      storage.setItem('kritzel-settings-homepage', '{"theme":"light"}');
      storage.setItem('kritzel-active-workspace-id', 'ws-1');
      storage.setItem('kritzel-active-workspace-id-homepage', 'ws-2');
      storage.setItem('kritzel-app-state-instance-id', 'instance-1');
      storage.setItem('kritzel-app-state-instance-id-homepage', 'instance-2');

      migrateLegacyStorageKeys(storage);

      expect(storage.getItem('updraw-settings')).toBe('{"theme":"dark"}');
      expect(storage.getItem('updraw-settings-homepage')).toBe('{"theme":"light"}');
      expect(storage.getItem('updraw-active-workspace-id')).toBe('ws-1');
      expect(storage.getItem('updraw-active-workspace-id-homepage')).toBe('ws-2');
      expect(storage.getItem('updraw-app-state-instance-id')).toBe('instance-1');
      expect(storage.getItem('updraw-app-state-instance-id-homepage')).toBe('instance-2');
      expect(storage.getItem('kritzel-settings')).toBe('{"theme":"dark"}');
    });

    it('never overwrites a current key', () => {
      storage.setItem('kritzel-settings', '{"theme":"dark"}');
      storage.setItem('updraw-settings', '{"theme":"light"}');

      migrateLegacyStorageKeys(storage);

      expect(storage.getItem('updraw-settings')).toBe('{"theme":"light"}');
    });

    it('ignores keys that are not library settings', () => {
      storage.setItem('kritzel_user', '{}');
      storage.setItem('kritzel-settingsfoo', 'x');
      storage.setItem('other', 'y');

      migrateLegacyStorageKeys(storage);

      expect(storage.length).toBe(3);
    });

    it('is idempotent', () => {
      storage.setItem('kritzel-settings', 'a');
      migrateLegacyStorageKeys(storage);
      migrateLegacyStorageKeys(storage);
      expect(storage.getItem('updraw-settings')).toBe('a');
      expect(storage.length).toBe(2);
    });

    it('does not throw when storage is unavailable', () => {
      const failing = {
        get length(): number {
          throw new Error('denied');
        },
      } as unknown as Storage;
      expect(() => migrateLegacyStorageKeys(failing)).not.toThrow();
    });

    it('covers the keys read by the library', () => {
      expect(LEGACY_STORAGE_KEYS.map(key => key.replace(/^kritzel-/, 'updraw-'))).toEqual([
        'updraw-settings',
        'updraw-active-workspace-id',
        'updraw-app-state-instance-id',
      ]);
    });
  });

  describe('reviving legacy data', () => {
    it('revives legacy objects as current classes without mutating the stored data', () => {
      const reviver = new UpdrawReviver(createCore());
      const stored = { __class__: 'KritzelPath', id: 'p1', points: [[0, 0], [10, 10]], translateX: 1, translateY: 2 };
      const snapshot = JSON.parse(JSON.stringify(stored));

      const revived = reviver.revive<UpdrawPath>(stored);

      expect(revived).toBeInstanceOf(UpdrawPath);
      expect(revived.__class__).toBe('UpdrawPath');
      expect(revived.id).toBe('p1');
      expect(revived.serialize().__class__).toBe('UpdrawPath');
      expect(stored).toEqual(snapshot);
    });

    it('revives legacy groups, dynamic objects and tools', () => {
      const reviver = new UpdrawReviver(createCore());

      const group = reviver.revive<UpdrawGroup>({ __class__: 'KritzelGroup', id: 'g1', childIds: ['p1'] });
      const dynamic = reviver.revive<UpdrawDynamicObject>({ __class__: 'KritzelCustomElement', id: 'd1' });
      const tool = reviver.revive<UpdrawBrushTool>({ __class__: 'KritzelBrushTool', name: 'brush' });

      expect(group).toBeInstanceOf(UpdrawGroup);
      expect(group.__class__).toBe('UpdrawGroup');
      expect(dynamic).toBeInstanceOf(UpdrawDynamicObject);
      expect(dynamic.__class__).toBe('UpdrawDynamicObject');
      expect(tool).toBeInstanceOf(UpdrawBrushTool);
    });

    it('revives a workspace export made before the rename', () => {
      const reviver = new UpdrawReviver(createCore());
      const data = JSON.parse(JSON.stringify(legacyWorkspace));

      const workspace = reviver.revive<UpdrawWorkspace>(data);
      const objects = data.objects.map((object: unknown) => reviver.revive<UpdrawPath>(object));

      expect(workspace).toBeInstanceOf(UpdrawWorkspace);
      expect(workspace.__class__).toBe('UpdrawWorkspace');
      expect(workspace.id).toBe(legacyWorkspace.id);
      expect(objects.length).toBeGreaterThan(0);
      for (const object of objects) {
        expect(object).toBeInstanceOf(UpdrawPath);
        expect(object.__class__).toBe('UpdrawPath');
        expect(object.serialize().__class__).toBe('UpdrawPath');
      }
    });

    it('revives v2 documents after the historical v2 → v3 migration', () => {
      const ydoc = new Y.Doc();
      const metadata = ydoc.getMap('metadata');
      const objectsMap = ydoc.getMap('objects');
      metadata.set('schemaVersion', 2);
      objectsMap.set('d1', { __class__: 'KritzelCustomElement', id: 'd1' });
      objectsMap.set('g1', { __class__: 'KritzelGroup', id: 'g1', childIds: ['d1'] });

      runMigrations(ydoc, metadata, { objects: objectsMap }, WORKSPACE_MIGRATIONS, 3);

      expect((objectsMap.get('d1') as any).__class__).toBe('KritzelDynamicObject');

      const reviver = new UpdrawReviver(createCore());
      const dynamic = reviver.revive<UpdrawDynamicObject>(objectsMap.get('d1'));
      const group = reviver.revive<UpdrawGroup>(objectsMap.get('g1'));
      expect(dynamic).toBeInstanceOf(UpdrawDynamicObject);
      expect(dynamic.__class__).toBe('UpdrawDynamicObject');
      expect(group).toBeInstanceOf(UpdrawGroup);
      expect(group.__class__).toBe('UpdrawGroup');
      expect(group.childIds).toEqual(['d1']);
    });
  });

  describe('clipboard payloads', () => {
    it('reads current and legacy payload prefixes', () => {
      expect(getClipboardPayloadJson('updraw-clipboard/v1:{"version":1}')).toBe('{"version":1}');
      expect(getClipboardPayloadJson('kritzel-clipboard/v1:{"version":1}')).toBe('{"version":1}');
    });

    it('returns null for other text', () => {
      expect(getClipboardPayloadJson('hello')).toBeNull();
      expect(getClipboardPayloadJson('')).toBeNull();
      expect(getClipboardPayloadJson(null)).toBeNull();
    });
  });
});
