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
});
