jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  Host: (props: any, children: any[]) => ({ type: 'Host', props, children }),
  h: (tag: any, props: any, ...children: any[]) => ({ type: tag, props, children }),
}));

import { KritzelActiveUsers } from './kritzel-active-users';

function collect(node: any, predicate: (value: any) => boolean, found: any[] = []): any[] {
  if (!node || typeof node !== 'object') {
    return found;
  }
  if (Array.isArray(node)) {
    node.forEach(child => collect(child, predicate, found));
    return found;
  }
  if (predicate(node)) {
    found.push(node);
  }
  (Array.isArray(node.children) ? node.children : [node.children]).forEach((child: any) => collect(child, predicate, found));
  return found;
}

const textOf = (node: any): string =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).join('')
      : node && typeof node === 'object'
        ? textOf(node.children ?? [])
        : '';

const wrappers = (tree: any) => collect(tree, node => node.props?.class?.['avatar-wrapper'] === true);

const agent = (overrides: Record<string, unknown> = {}) => ({
  id: 'writer',
  kind: 'agent',
  name: 'Writer',
  displayName: 'Writer',
  color: '#7C3AED',
  status: null,
  visible: true,
  activeAction: null,
  queueLength: 0,
  isRemote: false,
  ...overrides,
});

describe('kritzel-active-users', () => {
  it('shows agents after the users, local agents before remote ones', () => {
    const component = new KritzelActiveUsers();
    component.users = [{ id: 'ana', displayName: 'Ana' }] as any;
    component.agents = [
      agent({ id: 'remote', name: 'Remote', isRemote: true, clientId: 2, hostUser: { id: 'bo', displayName: 'Bo' } }),
      agent(),
    ] as any;

    const entries = wrappers(component.render());

    expect(entries.map(entry => entry.props['data-agent-id'] ?? 'user')).toEqual(['user', 'writer', 'remote']);
    expect(entries[2].props.class['is-remote']).toBe(true);
    expect(textOf(entries[2])).toContain('via Bo');
  });

  it('marks busy agents, shows their status and lists an agent the host passes as a user only once', () => {
    const component = new KritzelActiveUsers();
    component.users = [{ id: 'writer', displayName: 'Writer' }] as any;
    component.agents = [agent(), agent({ id: 'planner', name: 'Planner', status: 'Planning', activeAction: 'moveObject' })] as any;

    const entries = wrappers(component.render());

    expect(entries).toHaveLength(2);
    expect(entries[1].props.class['is-busy']).toBe(true);
    expect(textOf(entries[1])).toContain('Planning');
  });

  it('hides itself without users and agents', () => {
    const component = new KritzelActiveUsers();
    component.users = [];
    component.agents = [];

    expect(component.render().props).toEqual({ style: { display: 'none' } });
  });
});
