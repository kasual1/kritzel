jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
}));

import { KritzelObjectTitlebarLayer } from './kritzel-object-titlebar-layer';
import { KritzelResolvedTitlebar } from '../../classes/managers/object-titlebar.manager';

describe('KritzelObjectTitlebarLayer', () => {
  let component: KritzelObjectTitlebarLayer;

  const createTitlebar = (ownerId: string, isActive = false): KritzelResolvedTitlebar =>
    ({
      owner: { id: ownerId, __class__: 'KritzelShape' },
      context: { title: `Title ${ownerId}` },
      isActive,
      transform: 'translate(10px, 20px) rotate(0deg) scale(1)',
      width: 200,
      sections: {
        left: [{ item: { id: 'title', type: 'title' }, section: 'left', text: `Title ${ownerId}` }],
        center: [],
        right: [{ item: { id: 'play', type: 'button', icon: 'play' }, section: 'right', icon: 'play', tooltip: 'Play' }],
      },
    }) as unknown as KritzelResolvedTitlebar;

  /** Depth-first search through a rendered vnode tree. */
  const findAll = (vnode: any, predicate: (node: any) => boolean, found: any[] = []): any[] => {
    if (!vnode) return found;
    if (predicate(vnode)) found.push(vnode);
    (vnode.$children$ ?? []).forEach((child: any) => findAll(child, predicate, found));
    return found;
  };
  const byClass = (name: string) => (node: any) => node.$attrs$?.class?.[name] === true || String(node.$attrs$?.class ?? '').split(' ').includes(name);

  beforeEach(() => {
    component = new KritzelObjectTitlebarLayer();
  });

  it('renders an empty layer without titlebars', () => {
    const host: any = component.render();

    expect(host.$attrs$.class).toBe('object-titlebar-layer');
    expect(host.$children$ ?? []).toHaveLength(0);
  });

  it('renders one anchored titlebar per owner', () => {
    component.titlebars = [createTitlebar('a', true), createTitlebar('b')];

    const host: any = component.render();
    const anchors = findAll(host, byClass('object-titlebar-anchor'));
    const bars = findAll(host, byClass('object-titlebar'));

    expect(anchors).toHaveLength(2);
    expect(anchors[0].$attrs$.style).toEqual({ transform: 'translate(10px, 20px) rotate(0deg) scale(1)', width: '200px' });
    expect(bars.map(bar => bar.$attrs$['data-titlebar-owner-id'])).toEqual(['a', 'b']);
    expect(bars.map(bar => bar.$attrs$['data-state'])).toEqual(['active', 'inactive']);
    expect(bars[0].$attrs$.part).toBe('titlebar titlebar-active');
    expect(bars[0].$attrs$['aria-label']).toBe('Title a');
  });

  it('applies the surface pointer events to the drag surface', () => {
    component.titlebars = [createTitlebar('a')];
    component.surfacePointerEvents = 'auto';

    const [bar] = findAll(component.render(), byClass('object-titlebar'));

    expect(bar.$attrs$.style).toEqual({ pointerEvents: 'auto' });
  });

  it('skips the empty center section', () => {
    component.titlebars = [createTitlebar('a')];

    const host = component.render();

    expect(findAll(host, byClass('object-titlebar-left'))).toHaveLength(1);
    expect(findAll(host, byClass('object-titlebar-center'))).toHaveLength(0);
    expect(findAll(host, byClass('object-titlebar-right'))).toHaveLength(1);
  });

  it('reports button clicks with owner, section and item, and blurs after pointer clicks', () => {
    const itemClick = jest.fn();
    component.titlebars = [createTitlebar('a', true)];
    component.itemClick = itemClick;

    const [button] = findAll(component.render(), node => node.$tag$ === 'button');
    const anchorRect = { x: 1, y: 2, width: 3, height: 4 } as DOMRect;
    const currentTarget = { getBoundingClientRect: () => anchorRect, blur: jest.fn() };
    const event = { detail: 1, currentTarget } as unknown as MouseEvent;

    button.$attrs$.onClick(event);

    expect(itemClick).toHaveBeenCalledWith('a', 'right', 'play', event, anchorRect);
    expect(currentTarget.blur).toHaveBeenCalled();
    expect(button.$attrs$.tabindex).toBe(0);
    expect(button.$attrs$['data-kritzel-titlebar-control']).toBe('');
  });

  it('keeps focus on keyboard-activated buttons', () => {
    component.titlebars = [createTitlebar('a')];
    component.itemClick = jest.fn();

    const [button] = findAll(component.render(), node => node.$tag$ === 'button');
    const currentTarget = { getBoundingClientRect: () => ({}) as DOMRect, blur: jest.fn() };

    button.$attrs$.onClick({ detail: 0, currentTarget } as unknown as MouseEvent);

    expect(currentTarget.blur).not.toHaveBeenCalled();
    expect(button.$attrs$.tabindex).toBe(-1);
  });

  describe('title editing', () => {
    const titleEdit = () => ({ input: jest.fn(), commit: jest.fn(), cancel: jest.fn() });
    const editableTitlebar = (editing: boolean) => {
      const titlebar: any = createTitlebar('a', true);
      titlebar.owner.name = 'Desktop';
      titlebar.sections.left[0].isEditable = true;
      titlebar.editingItemId = editing ? 'title' : undefined;
      return titlebar as KritzelResolvedTitlebar;
    };

    it('marks editable titles so a second click can rename the object', () => {
      component.titlebars = [editableTitlebar(false)];

      const [title] = findAll(component.render(), byClass('object-titlebar-title'));

      expect(title.$attrs$['data-kritzel-titlebar-editable-title']).toBe('title');
      expect(byClass('is-editable')(title)).toBe(true);
    });

    it('renders an input in place of the title being edited', () => {
      component.titlebars = [editableTitlebar(true)];

      const host = component.render();
      const [input] = findAll(host, node => node.$tag$ === 'input');

      expect(findAll(host, byClass('object-titlebar-title'))).toHaveLength(0);
      expect(input.$attrs$['data-kritzel-titlebar-title-input']).toBe('');
      expect(input.$attrs$['data-kritzel-titlebar-control']).toBe('');
      expect(input.$attrs$.part).toBe('titlebar-title-input');
    });

    it('initializes the input once with the object name and selects it', () => {
      component.titlebars = [editableTitlebar(true)];
      const [input] = findAll(component.render(), node => node.$tag$ === 'input');
      const element: any = { dataset: {}, value: '', focus: jest.fn(), select: jest.fn() };

      input.$attrs$.ref(element);
      element.value = 'Typing';
      input.$attrs$.ref(element);

      expect(element.value).toBe('Typing');
      expect(element.focus).toHaveBeenCalledTimes(1);
      expect(element.select).toHaveBeenCalledTimes(1);
    });

    it('commits on Enter and blur, cancels on Escape and reports input', () => {
      const handlers = titleEdit();
      component.titlebars = [editableTitlebar(true)];
      component.titleEdit = handlers;
      const [input] = findAll(component.render(), node => node.$tag$ === 'input');
      const target = { value: 'New name' };
      const key = (name: string) => ({ key: name, target, preventDefault: jest.fn() });

      input.$attrs$.onInput({ target });
      input.$attrs$.onKeyDown(key('Enter'));
      input.$attrs$.onKeyDown(key('Escape'));
      input.$attrs$.onKeyDown(key('a'));
      input.$attrs$.onBlur({ target });

      expect(handlers.input).toHaveBeenCalledWith('New name');
      expect(handlers.commit).toHaveBeenNthCalledWith(1, 'New name');
      expect(handlers.commit).toHaveBeenCalledTimes(2);
      expect(handlers.cancel).toHaveBeenCalledTimes(1);
    });
  });
});
