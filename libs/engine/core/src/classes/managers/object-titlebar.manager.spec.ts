import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KRITZEL_OBJECT_TYPE_ICONS,
  KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE,
  KRITZEL_TITLEBAR_OWNER_ATTRIBUTE,
  KritzelObjectTitlebarManager,
} from './object-titlebar.manager';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelIconRegistry } from '../registries/icon-registry.class';
import { KritzelObjectTitlebarConfig } from '../../interfaces/object-titlebar.interface';
import { KritzelObjectConfig } from '../../interfaces/object-config.interface';
import { KritzelObjectConfigManager } from './object-config.manager';

describe('KritzelObjectTitlebarManager', () => {
  const terms: Record<string, string> = {
    'objectType.shape': 'Shape',
    'objectType.group': 'Group',
    'objectType.object': 'Object',
    'menu.copy': 'Copy',
  };

  let mockCore: any;
  let objects: Map<string, KritzelBaseObject<any>>;
  let manager: KritzelObjectTitlebarManager;

  const setConfig = (config: KritzelObjectTitlebarConfig | undefined) => {
    mockCore.engine.objectTitlebar = config;
  };

  /** Sets the engine's `objectConfig` prop. Every object has a titlebar until a test sets its own. */
  const setObjectConfig = (config: KritzelObjectConfig | undefined) => {
    mockCore.engine.objectConfig = config;
  };

  const createObject = (id: string, props: Partial<KritzelBaseObject<any>> & Record<string, unknown> = {}): KritzelBaseObject<any> => {
    const object = Object.assign(Object.create(KritzelBaseObject.prototype), {
      __class__: 'KritzelShape',
      id,
      workspaceId: 'workspace-1',
      translateX: 0,
      translateY: 0,
      width: 200,
      height: 100,
      padding: 0,
      scale: 1,
      rotation: 0,
      markedForRemoval: false,
      ...props,
    }) as KritzelBaseObject<any>;
    objects.set(id, object);
    return object;
  };

  const createGroup = (id: string, childIds: string[], props: Record<string, unknown> = {}): KritzelGroup => {
    const group = createObject(id, { __class__: 'KritzelGroup', ...props }) as unknown as KritzelGroup;
    Object.setPrototypeOf(group, KritzelGroup.prototype);
    group.childIds = childIds;
    Object.defineProperty(group, 'children', { get: () => childIds.map(childId => objects.get(childId)), configurable: true });
    return group;
  };

  const select = (...ids: string[]) => {
    mockCore.store.selectionGroup = { objectIds: ids };
  };

  const createElement = (attributes: Record<string, string>, parent?: any): any => {
    const node: any = {
      parent,
      hasAttribute: (name: string) => name in attributes,
      getAttribute: (name: string) => attributes[name] ?? null,
    };
    node.closest = (selector: string) => {
      const name = selector.slice(1, -1);
      let current = node;
      while (current) {
        if (current.hasAttribute(name)) return current;
        current = current.parent;
      }
      return null;
    };
    return node;
  };

  beforeEach(() => {
    objects = new Map();
    mockCore = {
      engine: {
        objectTitlebar: { left: [{ id: 'title', type: 'title' }] } as KritzelObjectTitlebarConfig,
        objectConfig: { hasTitlebar: true } as KritzelObjectConfig,
        emitObjectTitlebarAction: jest.fn(),
        host: { shadowRoot: { elementsFromPoint: jest.fn().mockReturnValue([]) } },
      },
      store: {
        state: { scale: 1, translateX: 0, translateY: 0 },
        selectionGroup: null,
        isDisabled: false,
        objects: { findById: (id: string) => objects.get(id) },
        get allObjects() {
          return Array.from(objects.values());
        },
      },
      localizationManager: {
        translate: jest.fn((key: string) => terms[key] ?? key),
      },
    };
    mockCore.objectConfigManager = new KritzelObjectConfigManager(mockCore);
    manager = new KritzelObjectTitlebarManager(mockCore);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('configuration', () => {
    it('is disabled without a config and renders nothing', () => {
      setConfig(undefined);
      createObject('a');

      expect(manager.isEnabled).toBe(false);
      expect(manager.resolveTitlebars(Array.from(objects.values()))).toEqual([]);
      expect(manager.getCullingPadding({ height: 28, offset: 6 })).toBe(0);
    });

    it('reads the config live from the engine prop', () => {
      setConfig(undefined);
      expect(manager.isEnabled).toBe(false);

      setConfig({ left: [] });
      expect(manager.isEnabled).toBe(true);
    });

    it('pads the render query by the titlebar band in world units', () => {
      mockCore.store.state.scale = 2;

      expect(manager.getCullingPadding({ height: 28, offset: 6 })).toBe(17);
    });

    it('reads pixel metrics from the theme and falls back otherwise', () => {
      const style = { getPropertyValue: (name: string) => ({ '--kritzel-titlebar-height': '32px', '--kritzel-titlebar-offset': '2rem' })[name] ?? '' };

      expect(manager.getMetrics(style)).toEqual({ height: 32, offset: 6 });
      expect(manager.getMetrics(null)).toEqual({ height: 28, offset: 6 });
    });
  });

  describe('getOwners', () => {
    const owners = () => manager.getOwners(Array.from(objects.values()));

    it('includes the objects for which objectConfig.hasTitlebar is true', () => {
      setObjectConfig({ hasTitlebar: object => object.__class__ === 'KritzelGroup' });
      createObject('shape');
      const group = createGroup('group', []);

      expect(owners()).toEqual([group]);
    });

    it('shows no titlebars and logs a hint once when hasTitlebar is not configured', () => {
      setObjectConfig(undefined);
      createObject('a');

      expect(owners()).toEqual([]);
      expect(manager.resolveTitlebars(Array.from(objects.values()))).toEqual([]);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain('objectConfig.hasTitlebar');

      manager.resetWarnings();
      owners();
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it('logs no hint while titlebars are disabled', () => {
      setConfig(undefined);
      setObjectConfig(undefined);
      createObject('a');

      expect(owners()).toEqual([]);
      expect(console.info).not.toHaveBeenCalled();
    });

    it('never gives grouped objects their own titlebar, even when hasTitlebar accepts them', () => {
      createObject('child');
      createGroup('inner', ['child']);
      const root = createGroup('root', ['inner']);

      expect(owners()).toEqual([root]);
    });

    it('lets hasTitlebar decide for groups like for any other object', () => {
      setObjectConfig({ hasTitlebar: object => object.__class__ !== 'KritzelGroup' });
      createObject('child');
      createGroup('group', ['child']);
      const loose = createObject('loose');

      expect(owners()).toEqual([loose]);
    });

    it('does not ask hasTitlebar about grouped objects, selection objects or objects marked for removal', () => {
      const hasTitlebar = jest.fn(() => true);
      setObjectConfig({ hasTitlebar });
      createObject('child');
      const group = createGroup('group', ['child']);
      createObject('sg', { __class__: 'KritzelSelectionGroup' });
      createObject('sb', { __class__: 'KritzelSelectionBox' });
      createObject('erased', { markedForRemoval: true });

      expect(owners()).toEqual([group]);
      expect(hasTitlebar).toHaveBeenCalledTimes(1);
      expect(hasTitlebar).toHaveBeenCalledWith(group);
    });
  });

  describe('active state', () => {
    it('marks selected owners active', () => {
      createObject('a');
      createObject('b');
      select('a');

      const titlebars = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebars.find(titlebar => titlebar.owner.id === 'a')?.isActive).toBe(true);
      expect(titlebars.find(titlebar => titlebar.owner.id === 'b')?.isActive).toBe(false);
    });

    it('marks every member of a multi-selection active', () => {
      createObject('a');
      createObject('b');
      select('a', 'b');

      expect(manager.resolveTitlebars(Array.from(objects.values())).every(titlebar => titlebar.isActive)).toBe(true);
    });

    it('marks a root group active when a nested group inside it is selected', () => {
      createObject('child');
      createGroup('inner', ['child']);
      createGroup('root', ['inner']);
      select('inner');

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.owner.id).toBe('root');
      expect(titlebar.isActive).toBe(true);
    });

    it('only shows active titlebars in active visibility mode', () => {
      setConfig({ visibility: 'active' });
      createObject('a');
      createObject('b');
      select('b');

      expect(manager.resolveTitlebars(Array.from(objects.values())).map(titlebar => titlebar.owner.id)).toEqual(['b']);
    });
  });

  describe('resolveTitlebars', () => {
    it('defaults the left section to the title', () => {
      setConfig({});
      createObject('a', { name: 'Desktop' });

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.sections.left.map(resolved => [resolved.item.id, resolved.text])).toEqual([['title', 'Desktop']]);
      expect(titlebar.sections.center).toEqual([]);
      expect(titlebar.sections.right).toEqual([]);
    });

    it('resolves titles from the config resolver, then the name, then a localized type label', () => {
      setConfig({ title: object => (object.id === 'a' ? 'From config' : undefined) });
      createObject('a', { name: 'Ignored' });
      createObject('b', { name: 'Named' });
      createObject('c');
      createObject('d', { __class__: 'KritzelUnknown' });

      const titles = manager.resolveTitlebars(Array.from(objects.values())).map(titlebar => titlebar.context.title);

      expect(titles).toEqual(['From config', 'Named', 'Shape', 'Object']);
    });

    it('hides titlebars of objects narrower than hideBelowWidth on screen', () => {
      setConfig({ hideBelowWidth: 50 });
      createObject('wide', { width: 200 });
      createObject('narrow', { width: 40 });

      expect(manager.resolveTitlebars(Array.from(objects.values())).map(titlebar => titlebar.owner.id)).toEqual(['wide']);
    });

    it('positions the anchor and exposes world and content sizes', () => {
      mockCore.store.state.scale = 0.5;
      createObject('a', { translateX: 10, translateY: 20, width: 400, height: 200, scale: 2 });

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.transform).toBe('translate(10px, 20px) rotate(0deg) scale(2)');
      expect(titlebar.width).toBeCloseTo(100);
      expect(titlebar.context.size).toEqual({ width: 200, height: 100 });
      expect(titlebar.context.contentSize).toEqual({ width: 400, height: 200 });
      expect(titlebar.context.barWidth).toBeCloseTo(100);
    });

    it('filters items by state, width and visibility', () => {
      setConfig({
        left: [
          { id: 'always', type: 'text', text: 'always' },
          { id: 'active-only', type: 'text', text: 'active', showWhen: 'active' },
          { id: 'inactive-only', type: 'text', text: 'inactive', showWhen: 'inactive' },
          { id: 'wide-only', type: 'text', text: 'wide', minBarWidth: 500 },
          { id: 'hidden', type: 'text', text: 'hidden', isVisible: ({ object }) => object.id !== 'a' },
        ],
      });
      createObject('a');

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.sections.left.map(resolved => resolved.item.id)).toEqual(['always', 'inactive-only']);
    });

    it('evaluates dynamic values and translates button labels', () => {
      setConfig({
        left: [{ id: 'size', type: 'text', tone: 'muted', text: ({ contentSize }) => `${contentSize.width}` }],
        right: [
          {
            id: 'copy',
            type: 'button',
            icon: () => 'copy',
            label: 'menu.copy',
            tooltip: 'Duplicate it',
            isDisabled: ({ isActive }) => !isActive,
            isPressed: true,
          },
        ],
      });
      createObject('a', { width: 1200 });

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.sections.left[0].text).toBe('1200');
      expect(titlebar.sections.right[0]).toEqual(
        expect.objectContaining({ icon: 'copy', label: 'Copy', tooltip: 'Duplicate it', isDisabled: true, isPressed: true }),
      );
    });

    it('isolates failing and asynchronous values and warns once per item', () => {
      setConfig({
        left: [
          {
            id: 'broken',
            type: 'text',
            text: () => {
              throw new Error('boom');
            },
          },
          { id: 'async', type: 'icon', icon: 'copy', isVisible: (() => Promise.resolve(true)) as unknown as () => boolean },
        ],
      });
      createObject('a');
      createObject('b');

      const titlebars = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebars[0].sections.left.map(resolved => [resolved.item.id, resolved.text])).toEqual([['broken', '']]);
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('resolves group children lazily', () => {
      setConfig({ left: [{ id: 'count', type: 'text', text: ({ children }) => `${children.length}` }] });
      createObject('child-1');
      createObject('child-2');
      createGroup('group', ['child-1', 'child-2']);

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.owner.id).toBe('group');
      expect(titlebar.sections.left[0].text).toBe('2');
    });
  });

  describe('getOwnerFromEvent', () => {
    it('resolves the owner from the titlebar surface in the event path', () => {
      const owner = createObject('a');
      const surface = createElement({ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: 'a' });
      const title = createElement({}, surface);

      expect(manager.getOwnerFromEvent({ clientX: 0, clientY: 0, composedPath: () => [title, surface] })).toBe(owner);
    });

    it('returns null for presses on controls', () => {
      createObject('a');
      const surface = createElement({ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: 'a' });
      const control = createElement({ [KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE]: '' }, surface);

      expect(manager.getOwnerFromEvent({ clientX: 0, clientY: 0, composedPath: () => [control, surface] })).toBeNull();
      expect(manager.isControlEvent({ composedPath: () => [control, surface] })).toBe(true);
    });

    it('resolves the owner of a control when controls are included', () => {
      const owner = createObject('a');
      const surface = createElement({ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: 'a' });
      const control = createElement({ [KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE]: '' }, surface);

      expect(manager.getOwnerFromEvent({ clientX: 0, clientY: 0, composedPath: () => [control, surface] }, { includeControls: true })).toBe(owner);
    });

    it('falls back to hit testing when the event was already dispatched', () => {
      const owner = createObject('a');
      const surface = createElement({ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: 'a' });
      const title = createElement({}, surface);
      mockCore.engine.host.shadowRoot.elementsFromPoint.mockReturnValue([title]);

      expect(manager.getOwnerFromEvent({ clientX: 5, clientY: 6, composedPath: () => [] })).toBe(owner);
      expect(mockCore.engine.host.shadowRoot.elementsFromPoint).toHaveBeenCalledWith(5, 6);
    });

    it('falls back to hit testing when the event was retargeted away from the titlebar', () => {
      const owner = createObject('a');
      const surface = createElement({ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: 'a' });
      mockCore.engine.host.shadowRoot.elementsFromPoint.mockReturnValue([createElement({}, surface)]);
      const host = createElement({});

      expect(manager.getOwnerFromEvent({ clientX: 5, clientY: 6, composedPath: () => [host] })).toBe(owner);
    });

    it('returns null when nothing at the pointer belongs to a titlebar', () => {
      createObject('a');
      mockCore.engine.host.shadowRoot.elementsFromPoint.mockReturnValue([createElement({})]);

      expect(manager.getOwnerFromEvent({ clientX: 5, clientY: 6, composedPath: () => [createElement({})] })).toBeNull();
    });

    it('returns null when titlebars are disabled', () => {
      setConfig(undefined);
      createObject('a');
      const surface = createElement({ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: 'a' });

      expect(manager.getOwnerFromEvent({ clientX: 0, clientY: 0, composedPath: () => [surface] })).toBeNull();
    });
  });

  describe('invokeItem', () => {
    const anchorRect = { x: 1, y: 2, width: 3, height: 4 } as DOMRect;
    const click = {} as MouseEvent;

    it('runs the action and emits the action event', () => {
      const action = jest.fn();
      setConfig({ right: [{ id: 'play', type: 'button', icon: 'play', action }] });
      createObject('a', { name: 'Desktop' });

      manager.invokeItem('a', 'right', 'play', click, anchorRect);

      expect(action).toHaveBeenCalledWith(expect.objectContaining({ title: 'Desktop', objectType: 'KritzelShape' }), click);
      expect(mockCore.engine.emitObjectTitlebarAction).toHaveBeenCalledWith({
        itemId: 'play',
        section: 'right',
        objectId: 'a',
        objectType: 'KritzelShape',
        workspaceId: 'workspace-1',
        anchorRect,
      });
    });

    it('does nothing for disabled buttons or while the engine is disabled', () => {
      const action = jest.fn();
      setConfig({ right: [{ id: 'play', type: 'button', action, isDisabled: true }] });
      createObject('a');

      manager.invokeItem('a', 'right', 'play', click, anchorRect);
      setConfig({ right: [{ id: 'play', type: 'button', action }] });
      mockCore.store.isDisabled = true;
      manager.invokeItem('a', 'right', 'play', click, anchorRect);

      expect(action).not.toHaveBeenCalled();
      expect(mockCore.engine.emitObjectTitlebarAction).not.toHaveBeenCalled();
    });

    it('ignores unknown items and non-button items', () => {
      setConfig({ left: [{ id: 'title', type: 'title' }] });
      createObject('a');

      manager.invokeItem('a', 'left', 'title', click, anchorRect);
      manager.invokeItem('a', 'left', 'missing', click, anchorRect);
      manager.invokeItem('missing', 'left', 'title', click, anchorRect);

      expect(mockCore.engine.emitObjectTitlebarAction).not.toHaveBeenCalled();
    });

    it('still emits the event when the action throws', () => {
      setConfig({
        right: [
          {
            id: 'play',
            type: 'button',
            action: () => {
              throw new Error('boom');
            },
          },
        ],
      });
      createObject('a');

      manager.invokeItem('a', 'right', 'play', click, anchorRect);

      expect(console.error).toHaveBeenCalled();
      expect(mockCore.engine.emitObjectTitlebarAction).toHaveBeenCalled();
    });
  });

  describe('default preset', () => {
    it('only uses registered icons', () => {
      const icons = [...Object.values(KRITZEL_OBJECT_TYPE_ICONS), 'square', 'play', 'plus'];

      for (const icon of icons) {
        expect(KritzelIconRegistry.has(icon)).toBe(true);
      }
    });

    it('shows the type icon and the title', () => {
      setConfig(KRITZEL_DEFAULT_OBJECT_TITLEBAR);
      createGroup('group', []);

      const [titlebar] = manager.resolveTitlebars(Array.from(objects.values()));

      expect(titlebar.sections.left.map(resolved => resolved.icon ?? resolved.text)).toEqual(['group', 'Group']);
    });
  });
});
