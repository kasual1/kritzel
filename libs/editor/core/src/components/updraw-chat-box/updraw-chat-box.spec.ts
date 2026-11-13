jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  Watch: () => () => {},
  Event: () => () => {},
  Listen: () => () => {},
  Element: () => () => {},
  Host: (props: any, children: any[]) => ({ type: 'Host', props, children }),
  h: (tag: any, props: any, ...children: any[]) => ({ type: tag, props, children }),
}));

import { KritzelChatBox } from './kritzel-chat-box';

function findNode(node: any, predicate: (value: any) => boolean): any {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (predicate(node)) {
    return node;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNode(child, predicate);
      if (match) {
        return match;
      }
    }
    return null;
  }

  const children = Array.isArray(node.children) ? node.children : [node.children];
  for (const child of children) {
    const match = findNode(child, predicate);
    if (match) {
      return match;
    }
  }

  return null;
}

describe('kritzel-chat-box', () => {
  it('keeps the stop button enabled while loading, even with no draft text', () => {
    const component = new KritzelChatBox();
    component.loading = true;
    const emitStop = jest.fn();
    Object.defineProperty(component, 'chatStop', { value: { emit: emitStop } });

    const button = findNode(component.render(), node => node?.props?.class === 'chat-submit');

    expect(button.props.disabled).toBe(false);
    expect(button.props['aria-label']).toBe('Stop');
    button.props.onClick();

    expect(emitStop).toHaveBeenCalledTimes(1);
    expect(component.value).toBe('');
  });

  it('still respects the disabled state while loading', () => {
    const component = new KritzelChatBox();
    component.loading = true;
    component.disabled = true;

    const button = findNode(component.render(), node => node?.props?.class === 'chat-submit');

    expect(button.props.disabled).toBe(true);
  });

  it('submits text when not loading', () => {
    const component = new KritzelChatBox();
    component.loading = false;
    component.value = 'Draw a tree';
    const emitSubmit = jest.fn();
    Object.defineProperty(component, 'chatSubmit', { value: { emit: emitSubmit } });

    const button = findNode(component.render(), node => node?.props?.class === 'chat-submit');

    expect(button.props.disabled).toBe(false);
    button.props.onClick();

    expect(emitSubmit).toHaveBeenCalledWith('Draw a tree');
    expect(component.value).toBe('');
  });

  it('keeps the draft when Enter is pressed while loading', () => {
    const component = new KritzelChatBox();
    component.loading = true;
    component.value = 'Next idea';
    const emitSubmit = jest.fn();
    Object.defineProperty(component, 'chatSubmit', { value: { emit: emitSubmit } });
    (component as any).scheduleCaretUpdate = jest.fn();
    const event = { key: 'Enter', shiftKey: false, isComposing: false, preventDefault: jest.fn(), stopPropagation: jest.fn() };

    (component as any).handleKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(emitSubmit).not.toHaveBeenCalled();
    expect(component.value).toBe('Next idea');

    component.loading = false;
    (component as any).handleKeyDown(event);
    expect(emitSubmit).toHaveBeenCalledWith('Next idea');
    expect(component.value).toBe('');
  });

  describe('chips', () => {
    const byClass = (className: string) => (node: any) => node?.props?.class === className;
    const byKey = (key: string) => (node: any) => node?.props?.key === key;
    const pageChip = { id: 'page', label: 'Music player', detail: 'play-button', icon: 'cursor' };
    const tipChip = { id: 'tip', label: 'Weather', hint: 'Pick an element' };

    it('renders an empty, polite chip row before the card', () => {
      const tree = new KritzelChatBox().render();

      expect(tree.children[0].props.class).toBe('chat-chips');
      expect(tree.children[0].props['aria-live']).toBe('polite');
      expect(tree.children[1].props.class).toBe('chat-box');
      expect(findNode(tree.children[0], byClass('chat-chip'))).toBeNull();
    });

    it('renders chips set after creation', () => {
      const component = new KritzelChatBox();
      component.chips = [pageChip, tipChip];
      const tree = component.render();

      const page = findNode(tree, byKey('page'));
      expect(page.props.class).toBe('chat-chip');
      expect(page.props.role).toBe('group');
      expect(page.props['aria-label']).toBe('Music player, play-button');
      expect(findNode(page, byClass('chat-chip-icon')).props.name).toBe('cursor');
      expect(findNode(page, byClass('chat-chip-label')).children).toEqual(['Music player']);
      expect(findNode(page, byClass('chat-chip-separator')).props['aria-hidden']).toBe('true');
      expect(findNode(page, byClass('chat-chip-detail')).children).toEqual(['play-button']);
      expect(findNode(page, byClass('chat-chip-hint'))).toBeNull();

      const tip = findNode(tree, byKey('tip'));
      expect(tip.props['aria-label']).toBe('Weather');
      expect(findNode(tip, byClass('chat-chip-hint')).children).toEqual(['Pick an element']);
      expect(findNode(tip, byClass('chat-chip-separator'))).toBeNull();
      expect(findNode(tip, byClass('chat-chip-detail'))).toBeNull();
      expect(findNode(tip, byClass('chat-chip-icon'))).toBeNull();

      component.chips = [];
      expect(findNode(component.render(), byClass('chat-chip'))).toBeNull();
      component.chips = null as any;
      expect(findNode(component.render(), byClass('chat-chip'))).toBeNull();
    });

    it('emits chatChipRemove with the chip from the remove button', () => {
      const component = new KritzelChatBox();
      const chips = [pageChip];
      component.chips = chips;
      const emit = jest.fn();
      Object.defineProperty(component, 'chatChipRemove', { value: { emit } });

      const button = findNode(component.render(), byClass('chat-chip-remove'));

      expect(button.type).toBe('button');
      expect(button.props.type).toBe('button');
      expect(button.props['aria-label']).toBe('Remove');
      expect(button.props.title).toBe('Remove');
      expect(button.props.disabled).toBe(false);
      button.props.onClick({ currentTarget: {} });

      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit.mock.calls[0][0]).toBe(pageChip);
      expect(component.chips).toBe(chips);
      expect(component.chips).toEqual([pageChip]);
    });

    it('moves focus to the input only after keyboard activation', () => {
      const component = new KritzelChatBox();
      component.chips = [pageChip];
      const emit = jest.fn();
      Object.defineProperty(component, 'chatChipRemove', { value: { emit } });
      const focusedButton = {};
      const focus = jest.fn();
      (component as any).host = { shadowRoot: { activeElement: focusedButton } };
      (component as any).textareaRef = { focus };

      const button = findNode(component.render(), byClass('chat-chip-remove'));
      button.props.onClick({ currentTarget: focusedButton });
      expect(focus).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledTimes(1);

      button.props.onClick({ currentTarget: {} });
      expect(focus).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledTimes(2);
    });

    it('keeps focus in the input when a chip is pressed', () => {
      const component = new KritzelChatBox();
      component.chips = [pageChip];
      const preventDefault = jest.fn();

      findNode(component.render(), byClass('chat-chip')).props.onMouseDown({ preventDefault });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('localizes the remove label, including late terms updates', () => {
      const component = new KritzelChatBox();
      component.chips = [pageChip];
      expect(findNode(component.render(), byClass('chat-chip-remove')).props['aria-label']).toBe('Remove');

      component.terms = { 'chatBox.removeChip': 'Entfernen' };
      const button = findNode(component.render(), byClass('chat-chip-remove'));

      expect(button.props['aria-label']).toBe('Entfernen');
      expect(button.props.title).toBe('Entfernen');
    });

    it('shows at most three chips and summarizes the rest', () => {
      const component = new KritzelChatBox();
      component.chips = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, label: id }));
      const findAll = (node: any, out: any[] = []): any[] => {
        if (!node || typeof node !== 'object') return out;
        if (Array.isArray(node)) { node.forEach(child => findAll(child, out)); return out; }
        if (node.props?.class === 'chat-chip') out.push(node);
        findAll(node.children, out);
        return out;
      };

      let tree = component.render();
      expect(findAll(tree).map(chip => chip.props.key)).toEqual(['a', 'b', 'c']);
      expect(findNode(tree, byClass('chat-chips-more')).children.join('')).toBe('+2 more');

      component.terms = { 'chatBox.moreChips': 'weitere' };
      expect(findNode(component.render(), byClass('chat-chips-more')).children.join('')).toBe('+2 weitere');

      component.chips = component.chips.slice(0, 3);
      tree = component.render();
      expect(findAll(tree)).toHaveLength(3);
      expect(findNode(tree, byClass('chat-chips-more'))).toBeNull();
    });

    it('disables remove buttons only while the chat box is disabled', () => {
      const component = new KritzelChatBox();
      component.chips = [pageChip];
      component.disabled = true;
      expect(findNode(component.render(), byClass('chat-chip-remove')).props.disabled).toBe(true);

      component.disabled = false;
      component.loading = true;
      expect(findNode(component.render(), byClass('chat-chip-remove')).props.disabled).toBe(false);
    });
  });
});
