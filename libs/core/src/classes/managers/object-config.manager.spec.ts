import { UpmadeObjectConfigManager } from './object-config.manager';
import { UpmadeBaseObject } from '../objects/base-object.class';
import { UpmadeGroup } from '../objects/group.class';
import { UpmadeSelectionGroup } from '../objects/selection-group.class';
import { UpmadeObjectConfig } from '../../interfaces/object-config.interface';

describe('UpmadeObjectConfigManager', () => {
  let mockCore: any;
  let objects: Map<string, UpmadeBaseObject<any>>;
  let manager: UpmadeObjectConfigManager;

  const setConfig = (config: UpmadeObjectConfig | undefined) => {
    mockCore.engine.objectConfig = config;
  };

  const createObject = (id: string, props: Record<string, unknown> = {}): UpmadeBaseObject<any> => {
    const object = Object.assign(Object.create(UpmadeBaseObject.prototype), {
      __class__: 'UpmadeShape',
      id,
      isRotatable: true,
      isResizable: true,
      ...props,
    }) as UpmadeBaseObject<any>;
    objects.set(id, object);
    return object;
  };

  const createGroup = (id: string, childIds: string[], props: Record<string, unknown> = {}): UpmadeGroup => {
    const group = createObject(id, { __class__: 'UpmadeGroup', ...props }) as unknown as UpmadeGroup;
    Object.setPrototypeOf(group, UpmadeGroup.prototype);
    group.childIds = childIds;
    return group;
  };

  const createSelection = (...selected: UpmadeBaseObject<any>[]): UpmadeSelectionGroup => {
    const selection = Object.create(UpmadeSelectionGroup.prototype) as UpmadeSelectionGroup;
    Object.defineProperty(selection, '__class__', { value: 'UpmadeSelectionGroup' });
    Object.defineProperty(selection, 'objects', { get: () => selected });
    return selection;
  };

  beforeEach(() => {
    objects = new Map();
    mockCore = {
      engine: { objectConfig: undefined },
      store: { objects: { findById: (id: string) => objects.get(id) } },
    };
    manager = new UpmadeObjectConfigManager(mockCore);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('defaults', () => {
    it('allows rotating and resizing and shows no titlebars without a config', () => {
      const object = createObject('a');

      expect(manager.isRotatable(object)).toBe(true);
      expect(manager.isResizable(object)).toBe(true);
      expect(manager.hasTitlebar(object)).toBe(false);
      expect(manager.isConfigured('hasTitlebar')).toBe(false);
    });

    it('reads the config live from the engine prop', () => {
      const object = createObject('a');

      setConfig({ isRotatable: false });

      expect(manager.isRotatable(object)).toBe(false);
      expect(manager.isConfigured('isRotatable')).toBe(true);
    });
  });

  describe('values', () => {
    it('accepts booleans for every object', () => {
      setConfig({ hasTitlebar: true, isRotatable: false, isResizable: false });
      const object = createObject('a');

      expect(manager.hasTitlebar(object)).toBe(true);
      expect(manager.isRotatable(object)).toBe(false);
      expect(manager.isResizable(object)).toBe(false);
    });

    it('accepts functions deciding per object', () => {
      setConfig({ isRotatable: object => object.__class__ !== 'UpmadeText' });

      expect(manager.isRotatable(createObject('shape'))).toBe(true);
      expect(manager.isRotatable(createObject('text', { __class__: 'UpmadeText' }))).toBe(false);
    });

    it('uses the default for non-boolean results', () => {
      setConfig({ hasTitlebar: () => 1 as unknown as boolean, isRotatable: () => undefined as unknown as boolean });
      const object = createObject('a');

      expect(manager.hasTitlebar(object)).toBe(false);
      expect(manager.isRotatable(object)).toBe(true);
    });

    it('uses the default for a throwing function and warns once per option', () => {
      setConfig({
        isRotatable: () => {
          throw new Error('boom');
        },
      });
      const object = createObject('a');

      expect(manager.isRotatable(object)).toBe(true);
      expect(manager.isRotatable(object)).toBe(true);
      expect(console.warn).toHaveBeenCalledTimes(1);

      manager.resetWarnings();
      manager.isRotatable(object);
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('uses the default for a function returning a promise', () => {
      setConfig({ hasTitlebar: () => Promise.resolve(true) as unknown as boolean });

      expect(manager.hasTitlebar(createObject('a'))).toBe(false);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('object flags', () => {
    it('combines the persisted flags with the config, so either can forbid', () => {
      const locked = createObject('locked', { isRotatable: false, isResizable: false });
      const free = createObject('free');

      setConfig({ isRotatable: true, isResizable: true });
      expect(manager.isRotatable(locked)).toBe(false);
      expect(manager.isResizable(locked)).toBe(false);

      setConfig({ isRotatable: false, isResizable: false });
      expect(manager.isRotatable(free)).toBe(false);
      expect(manager.isResizable(free)).toBe(false);
    });
  });

  describe('groups and selections', () => {
    it('requires every object inside a group, including nested groups', () => {
      createObject('child', { isRotatable: false });
      createObject('sibling');
      createGroup('inner', ['child']);
      const root = createGroup('root', ['inner', 'sibling']);

      expect(manager.isRotatable(root)).toBe(false);
      expect(manager.isResizable(root)).toBe(true);
    });

    it('applies the config to the objects inside a group', () => {
      createObject('text', { __class__: 'UpmadeText' });
      const group = createGroup('group', ['text']);

      setConfig({ isResizable: object => object.__class__ !== 'UpmadeText' });

      expect(manager.isResizable(group)).toBe(false);
    });

    it('ignores child ids that no longer resolve', () => {
      const group = createGroup('group', ['missing']);

      expect(manager.isRotatable(group)).toBe(true);
    });

    it('requires every selected object of a selection group', () => {
      const free = createObject('free');
      const locked = createObject('locked', { isResizable: false });

      expect(manager.isResizable(createSelection(free))).toBe(true);
      expect(manager.isResizable(createSelection(free, locked))).toBe(false);
    });

    it('asks hasTitlebar about the object only, not its children', () => {
      const hasTitlebar = jest.fn(() => true);
      setConfig({ hasTitlebar });
      createObject('child');
      const group = createGroup('group', ['child']);

      expect(manager.hasTitlebar(group)).toBe(true);
      expect(hasTitlebar).toHaveBeenCalledTimes(1);
    });
  });
});
