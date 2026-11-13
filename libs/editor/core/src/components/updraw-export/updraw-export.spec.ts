jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  Watch: () => () => {},
  Event: () => () => {},
  Method: () => () => {},
  Listen: () => () => {},
  Element: () => () => {},
  Host: (props: any, children: any[]) => ({ type: 'Host', props, children }),
  h: (tag: any, props: any, ...children: any[]) => ({ type: tag, props, children }),
}));

import { KritzelExport } from './kritzel-export';

function findNode(node: any, predicate: (value: any) => boolean): any {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (predicate(node)) {
    return node;
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

function collectText(node: any): string {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join('');
  }

  if (!node || typeof node !== 'object') {
    return '';
  }

  return collectText(node.props?.children) + collectText(node.children);
}

describe('kritzel-export', () => {
  it('renders the export button in the dialog footer', async () => {
    const component = new KritzelExport();

    await component.open();
    const tree = component.render() as any;
    const footerNode = findNode(tree, (node: any) => node?.props?.slot === 'footer');
    const buttonNode = findNode(footerNode, (node: any) => node?.props?.class === 'export-primary-button');

    expect(collectText(buttonNode).trim()).toBe('Export');
    expect(findNode(tree, (node: any) => node?.props?.class === 'export-content')).not.toBeNull();
  });
});
