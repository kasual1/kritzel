import * as Y from 'yjs';
import {
  isLegacyClassName,
  LEGACY_ASSET_DB_NAMES,
  LEGACY_BRANDS,
  LEGACY_CLASS_PREFIXES,
  LEGACY_CLIPBOARD_PAYLOAD_PREFIXES,
  LEGACY_CONTENT_CSS_VARIABLES,
  LEGACY_ELEMENT_ID_ATTRIBUTES,
  LEGACY_IFRAME_GLOBALS,
  LEGACY_IFRAME_STATE_EVENTS,
  LEGACY_NAME_PREFIXES,
  LEGACY_STORAGE_KEYS,
  migrateLegacyStorageKeys,
  normalizeLegacyClassName,
  toLegacyDocumentName,
  toLegacyDocumentNames,
} from './legacy-brand';
import { runMigrations } from '../helpers/migration.helper';
import { WORKSPACE_MIGRATIONS } from './workspace.migrations';
import { UpmadeReviver } from '../classes/core/reviver.class';
import { UpmadePath } from '../classes/objects/path.class';
import { UpmadeGroup } from '../classes/objects/group.class';
import { UpmadeDynamicObject } from '../classes/objects/dynamic-object.class';
import { UpmadeWorkspace } from '../classes/core/workspace.class';
import { UpmadeBrushTool } from '../classes/tools/brush-tool.class';
import { UpmadeIframeObject } from '../classes/objects/iframe.class';
import { UpmadeImage } from '../classes/objects/image.class';
import { getClipboardPayloadJson } from '../classes/managers/clipboard.types';
// Exported by Kritzel, before the first rename.
import legacyWorkspace from '../__fixtures__/legacy-workspace.json';
// Exported by Updraw 0.6.2: every object class, an embedded asset and iframe content that uses the Updraw runtime API.
import legacyUpdrawWorkspace from '../__fixtures__/legacy-updraw-workspace.json';

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
  describe('legacy names', () => {
    it('lists the former names newest first', () => {
      expect(LEGACY_BRANDS).toEqual([
        { name: 'updraw', className: 'Updraw' },
        { name: 'kritzel', className: 'Kritzel' },
      ]);
    });

    it('derives every legacy name from the list, newest first', () => {
      expect(LEGACY_CLASS_PREFIXES).toEqual(['Updraw', 'Kritzel']);
      expect(LEGACY_NAME_PREFIXES).toEqual(['updraw-', 'kritzel-']);
      expect(LEGACY_CLIPBOARD_PAYLOAD_PREFIXES).toEqual(['updraw-clipboard/v1:', 'kritzel-clipboard/v1:']);
      expect(LEGACY_ASSET_DB_NAMES).toEqual(['updraw-assets', 'kritzel-assets']);
      expect(LEGACY_IFRAME_GLOBALS).toEqual(['updraw', 'kritzel']);
      expect(LEGACY_IFRAME_STATE_EVENTS).toEqual(['updrawstatechange', 'kritzelstatechange']);
      expect(LEGACY_ELEMENT_ID_ATTRIBUTES).toEqual(['data-updraw-id', 'data-kritzel-id']);
    });

    it('maps the legacy content CSS variables of every former name to the current ones', () => {
      expect(LEGACY_CONTENT_CSS_VARIABLES).toEqual({
        '--updraw-iframe-default-cursor': '--upmade-iframe-default-cursor',
        '--updraw-iframe-pointer-cursor': '--upmade-iframe-pointer-cursor',
        '--updraw-content-border-radius': '--upmade-content-border-radius',
        '--kritzel-iframe-default-cursor': '--upmade-iframe-default-cursor',
        '--kritzel-iframe-pointer-cursor': '--upmade-iframe-pointer-cursor',
        '--kritzel-content-border-radius': '--upmade-content-border-radius',
      });
    });
  });

  describe('normalizeLegacyClassName', () => {
    it.each(['Updraw', 'Kritzel'])('maps %s class names to the current prefix', prefix => {
      expect(normalizeLegacyClassName(`${prefix}Path`)).toBe('UpmadePath');
      expect(normalizeLegacyClassName(`${prefix}Workspace`)).toBe('UpmadeWorkspace');
      expect(normalizeLegacyClassName(`${prefix}BrushTool`)).toBe('UpmadeBrushTool');
      expect(normalizeLegacyClassName(`${prefix}DynamicObject`)).toBe('UpmadeDynamicObject');
    });

    it('maps the pre-v3 custom element class to the dynamic object class', () => {
      expect(normalizeLegacyClassName('KritzelCustomElement')).toBe('UpmadeDynamicObject');
    });

    it('leaves current and unknown class names unchanged', () => {
      expect(normalizeLegacyClassName('UpmadePath')).toBe('UpmadePath');
      expect(normalizeLegacyClassName('MyCustomObject')).toBe('MyCustomObject');
      expect(normalizeLegacyClassName('constructor')).toBe('constructor');
      expect(normalizeLegacyClassName('')).toBe('');
    });

    it('detects legacy class names', () => {
      expect(isLegacyClassName('UpdrawPath')).toBe(true);
      expect(isLegacyClassName('KritzelPath')).toBe(true);
      expect(isLegacyClassName('UpmadePath')).toBe(false);
      expect(isLegacyClassName(undefined)).toBe(false);
    });
  });

  describe('toLegacyDocumentNames', () => {
    it('returns the names of default document names under every former name, newest first', () => {
      expect(toLegacyDocumentNames('upmade-workspace-abc')).toEqual(['updraw-workspace-abc', 'kritzel-workspace-abc']);
      expect(toLegacyDocumentNames('upmade-app-state-editor-1-uuid')).toEqual([
        'updraw-app-state-editor-1-uuid',
        'kritzel-app-state-editor-1-uuid',
      ]);
      expect(toLegacyDocumentNames('upmade-assets')).toEqual(['updraw-assets', 'kritzel-assets']);
    });

    it('returns an empty array for names without the upmade- prefix', () => {
      expect(toLegacyDocumentNames('my-room')).toEqual([]);
      expect(toLegacyDocumentNames('updraw-workspace-abc')).toEqual([]);
      expect(toLegacyDocumentNames('kritzel-workspace-abc')).toEqual([]);
    });
  });

  describe('toLegacyDocumentName (deprecated)', () => {
    it('returns the name before the latest rename', () => {
      expect(toLegacyDocumentName('upmade-workspace-abc')).toBe('updraw-workspace-abc');
      expect(toLegacyDocumentName('upmade-app-state-editor-1-uuid')).toBe('updraw-app-state-editor-1-uuid');
    });

    it('returns null for names without the upmade- prefix', () => {
      expect(toLegacyDocumentName('my-room')).toBeNull();
      expect(toLegacyDocumentName('updraw-workspace-abc')).toBeNull();
    });
  });

  describe('migrateLegacyStorageKeys', () => {
    let storage: MemoryStorage;

    beforeEach(() => {
      storage = new MemoryStorage();
    });

    it.each(['updraw', 'kritzel'])('copies every %s key, including editor-scoped keys, and keeps the legacy keys', brand => {
      storage.setItem(`${brand}-settings`, '{"theme":"dark"}');
      storage.setItem(`${brand}-settings-homepage`, '{"theme":"light"}');
      storage.setItem(`${brand}-active-workspace-id`, 'ws-1');
      storage.setItem(`${brand}-active-workspace-id-homepage`, 'ws-2');
      storage.setItem(`${brand}-app-state-instance-id`, 'instance-1');
      storage.setItem(`${brand}-app-state-instance-id-homepage`, 'instance-2');

      migrateLegacyStorageKeys(storage);

      expect(storage.getItem('upmade-settings')).toBe('{"theme":"dark"}');
      expect(storage.getItem('upmade-settings-homepage')).toBe('{"theme":"light"}');
      expect(storage.getItem('upmade-active-workspace-id')).toBe('ws-1');
      expect(storage.getItem('upmade-active-workspace-id-homepage')).toBe('ws-2');
      expect(storage.getItem('upmade-app-state-instance-id')).toBe('instance-1');
      expect(storage.getItem('upmade-app-state-instance-id-homepage')).toBe('instance-2');
      expect(storage.getItem(`${brand}-settings`)).toBe('{"theme":"dark"}');
    });

    it('prefers updraw values over kritzel values, whatever order they are stored in', () => {
      // Kritzel keys first and last, so the result cannot depend on the storage's key order.
      storage.setItem('kritzel-settings', '{"theme":"kritzel"}');
      storage.setItem('kritzel-app-state-instance-id-homepage', 'kritzel-instance');
      storage.setItem('updraw-settings', '{"theme":"updraw"}');
      storage.setItem('updraw-active-workspace-id', 'updraw-ws');
      storage.setItem('updraw-app-state-instance-id-homepage', 'updraw-instance');
      storage.setItem('kritzel-active-workspace-id', 'kritzel-ws');

      migrateLegacyStorageKeys(storage);

      expect(storage.getItem('upmade-settings')).toBe('{"theme":"updraw"}');
      expect(storage.getItem('upmade-active-workspace-id')).toBe('updraw-ws');
      expect(storage.getItem('upmade-app-state-instance-id-homepage')).toBe('updraw-instance');
    });

    it('falls back to the kritzel value for keys without an updraw value', () => {
      storage.setItem('updraw-settings', '{"theme":"updraw"}');
      storage.setItem('kritzel-settings', '{"theme":"kritzel"}');
      storage.setItem('kritzel-active-workspace-id-homepage', 'kritzel-ws');

      migrateLegacyStorageKeys(storage);

      expect(storage.getItem('upmade-settings')).toBe('{"theme":"updraw"}');
      expect(storage.getItem('upmade-active-workspace-id-homepage')).toBe('kritzel-ws');
    });

    it('never overwrites a current key', () => {
      storage.setItem('updraw-settings', '{"theme":"dark"}');
      storage.setItem('kritzel-settings', '{"theme":"dark"}');
      storage.setItem('upmade-settings', '{"theme":"light"}');

      migrateLegacyStorageKeys(storage);

      expect(storage.getItem('upmade-settings')).toBe('{"theme":"light"}');
    });

    it('ignores keys that are not library settings', () => {
      storage.setItem('kritzel_user', '{}');
      storage.setItem('kritzel-settingsfoo', 'x');
      storage.setItem('updraw-settingsfoo', 'x');
      // Written by Updraw when it imported a Kritzel database; markers are per current name.
      storage.setItem('updraw-legacy-import:kritzel-workspace-1', '1');
      storage.setItem('other', 'y');

      migrateLegacyStorageKeys(storage);

      expect(storage.length).toBe(5);
    });

    it('is idempotent', () => {
      storage.setItem('kritzel-settings', 'a');
      migrateLegacyStorageKeys(storage);
      migrateLegacyStorageKeys(storage);
      expect(storage.getItem('upmade-settings')).toBe('a');
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

    it('covers the keys read by the library under every former name, newest first', () => {
      expect(LEGACY_STORAGE_KEYS).toEqual([
        'updraw-settings',
        'updraw-active-workspace-id',
        'updraw-app-state-instance-id',
        'kritzel-settings',
        'kritzel-active-workspace-id',
        'kritzel-app-state-instance-id',
      ]);
    });
  });

  describe('reviving legacy data', () => {
    it.each(['UpdrawPath', 'KritzelPath'])('revives %s objects as current classes without mutating the stored data', legacyClass => {
      const reviver = new UpmadeReviver(createCore());
      const stored = { __class__: legacyClass, id: 'p1', points: [[0, 0], [10, 10]], translateX: 1, translateY: 2 };
      const snapshot = JSON.parse(JSON.stringify(stored));

      const revived = reviver.revive<UpmadePath>(stored);

      expect(revived).toBeInstanceOf(UpmadePath);
      expect(revived.__class__).toBe('UpmadePath');
      expect(revived.id).toBe('p1');
      expect(revived.serialize().__class__).toBe('UpmadePath');
      expect(stored).toEqual(snapshot);
    });

    it.each([
      ['Updraw', 'UpdrawDynamicObject'],
      ['Kritzel', 'KritzelCustomElement'],
    ])('revives %s groups, dynamic objects and tools', (prefix, dynamicClass) => {
      const reviver = new UpmadeReviver(createCore());

      const group = reviver.revive<UpmadeGroup>({ __class__: `${prefix}Group`, id: 'g1', childIds: ['p1'] });
      const dynamic = reviver.revive<UpmadeDynamicObject>({ __class__: dynamicClass, id: 'd1' });
      const tool = reviver.revive<UpmadeBrushTool>({ __class__: `${prefix}BrushTool`, name: 'brush' });

      expect(group).toBeInstanceOf(UpmadeGroup);
      expect(group.__class__).toBe('UpmadeGroup');
      expect(dynamic).toBeInstanceOf(UpmadeDynamicObject);
      expect(dynamic.__class__).toBe('UpmadeDynamicObject');
      expect(tool).toBeInstanceOf(UpmadeBrushTool);
    });

    it('revives a document that mixes objects saved by Kritzel, Updraw and Upmade', () => {
      const reviver = new UpmadeReviver(createCore());
      const stored = [
        { __class__: 'KritzelPath', id: 'p1' },
        { __class__: 'UpdrawPath', id: 'p2' },
        { __class__: 'UpmadePath', id: 'p3' },
        { __class__: 'UpdrawGroup', id: 'g1', childIds: ['p1', 'p2', 'p3'] },
      ];

      const revived = stored.map(object => reviver.revive<UpmadePath | UpmadeGroup>(object));

      expect(revived.map(object => object.__class__)).toEqual(['UpmadePath', 'UpmadePath', 'UpmadePath', 'UpmadeGroup']);
      expect((revived[3] as UpmadeGroup).childIds).toEqual(['p1', 'p2', 'p3']);
    });

    it('revives a workspace export made by Kritzel', () => {
      const reviver = new UpmadeReviver(createCore());
      const data = JSON.parse(JSON.stringify(legacyWorkspace));

      const workspace = reviver.revive<UpmadeWorkspace>(data);
      const objects = data.objects.map((object: unknown) => reviver.revive<UpmadePath>(object));

      expect(workspace).toBeInstanceOf(UpmadeWorkspace);
      expect(workspace.__class__).toBe('UpmadeWorkspace');
      expect(workspace.id).toBe(legacyWorkspace.id);
      expect(objects.length).toBeGreaterThan(0);
      for (const object of objects) {
        expect(object).toBeInstanceOf(UpmadePath);
        expect(object.__class__).toBe('UpmadePath');
        expect(object.serialize().__class__).toBe('UpmadePath');
      }
    });

    it('revives a workspace export made by Updraw 0.6.2', () => {
      const reviver = new UpmadeReviver(createCore());
      const data = JSON.parse(JSON.stringify(legacyUpdrawWorkspace));
      const snapshot = JSON.parse(JSON.stringify(data));

      const workspace = reviver.revive<UpmadeWorkspace>(data);
      const objects = data.objects.map((object: unknown) => reviver.revive<any>(object));

      expect(workspace).toBeInstanceOf(UpmadeWorkspace);
      expect(workspace.__class__).toBe('UpmadeWorkspace');
      expect(workspace.id).toBe(legacyUpdrawWorkspace.id);
      expect(objects.map((object: { __class__: string }) => object.__class__)).toEqual([
        'UpmadePath',
        'UpmadeShape',
        'UpmadeText',
        'UpmadeLine',
        'UpmadeImage',
        'UpmadeGroup',
        'UpmadeIframeObject',
        'UpmadeDynamicObject',
      ]);
      for (const object of objects) {
        expect(object.serialize().__class__).toMatch(/^Upmade/);
      }
      // Content and references survive revival unchanged: the runtime API they use is aliased, not rewritten.
      const image = objects[4] as UpmadeImage;
      expect(image.assetId).toBe(Object.keys(legacyUpdrawWorkspace.assets)[0]);
      const iframe = objects[6] as UpmadeIframeObject;
      expect(iframe.content.html).toContain('data-updraw-id="count"');
      expect(iframe.content.script).toContain("addEventListener('updrawstatechange'");
      expect(iframe.state).toEqual({ count: 3 });
      expect((objects[7] as UpmadeDynamicObject).element.outerHTML).toContain('var(--updraw-content-border-radius)');
      expect(data).toEqual(snapshot);
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

      const reviver = new UpmadeReviver(createCore());
      const dynamic = reviver.revive<UpmadeDynamicObject>(objectsMap.get('d1'));
      const group = reviver.revive<UpmadeGroup>(objectsMap.get('g1'));
      expect(dynamic).toBeInstanceOf(UpmadeDynamicObject);
      expect(dynamic.__class__).toBe('UpmadeDynamicObject');
      expect(group).toBeInstanceOf(UpmadeGroup);
      expect(group.__class__).toBe('UpmadeGroup');
      expect(group.childIds).toEqual(['d1']);
    });
  });

  describe('clipboard payloads', () => {
    it('reads current and legacy payload prefixes', () => {
      expect(getClipboardPayloadJson('upmade-clipboard/v1:{"version":1}')).toBe('{"version":1}');
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
