jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
}));

import { KritzelAgenticCursors } from './kritzel-agentic-cursors';
import type { KritzelAgenticCursor, KritzelCore } from '@kritzel/core';

interface VNode {
  $tag$?: string | ((...args: unknown[]) => unknown);
  $attrs$?: Record<string, any> | null;
  $children$?: VNode[] | null;
  $key$?: string;
}

/** All rendered element nodes, depth first. */
const flatten = (node: VNode | null | undefined, out: VNode[] = []): VNode[] => {
  if (!node) return out;
  out.push(node);
  (node.$children$ ?? []).forEach(child => flatten(child, out));
  return out;
};

const byClass = (root: VNode, className: string) =>
  flatten(root).filter(node => typeof node.$attrs$?.class === 'string' && node.$attrs$.class.split(' ').includes(className));

const createCursor = (overrides: Partial<KritzelAgenticCursor> = {}): KritzelAgenticCursor => ({
  id: 'agent',
  name: 'Agent',
  color: '#7C3AED',
  visible: true,
  position: { x: 10, y: 10 },
  attachedTo: null,
  isMoving: false,
  selectedObjectIds: [],
  isPressed: false,
  pressCount: 0,
  activeAction: null,
  queueLength: 0,
  canUndo: false,
  canRedo: false,
  ...overrides,
});

describe('KritzelAgenticCursors', () => {
  let component: KritzelAgenticCursors;
  let cursors: KritzelAgenticCursor[];
  let objects: Map<string, any>;
  let changeListener: (() => void) | null;
  let frameListener: (() => void) | null;
  let state: any;
  let unsubscribeChange: jest.Mock;
  let unsubscribeFrame: jest.Mock;

  const createObject = (id: string, x: number, y: number, width: number, height: number) => ({
    id,
    rotatedPolygon: {
      topLeft: { x, y },
      topRight: { x: x + width, y },
      bottomRight: { x: x + width, y: y + height },
      bottomLeft: { x, y: y + height },
    },
  });

  beforeEach(() => {
    cursors = [createCursor()];
    objects = new Map();
    state = { scale: 2, translateX: 5, translateY: 0, viewportWidth: 1000, viewportHeight: 800 };
    unsubscribeChange = jest.fn();
    unsubscribeFrame = jest.fn();
    const core = {
      store: {
        state,
        objects: { findById: (id: string) => objects.get(id) },
      },
      agenticCursorManager: {
        getAll: () => cursors,
        onChange: (listener: () => void) => {
          changeListener = listener;
          return unsubscribeChange;
        },
        onFrame: (listener: () => void) => {
          frameListener = listener;
          return unsubscribeFrame;
        },
      },
    } as unknown as KritzelCore;

    component = new KritzelAgenticCursors();
    component.core = core;
    component.showEdgeIndicators = true;
    component.edgeIndicatorPadding = 8;
    component.version = 0;
    component.connectedCallback();
  });

  it('subscribes on connect and unsubscribes on disconnect', () => {
    expect(changeListener).toBeInstanceOf(Function);
    expect(frameListener).toBeInstanceOf(Function);
    component.disconnectedCallback();
    expect(unsubscribeChange).toHaveBeenCalled();
    expect(unsubscribeFrame).toHaveBeenCalled();
  });

  it('renders no selection layer or ripple while idle', () => {
    const root = component.render() as unknown as VNode;
    expect(byClass(root, 'agentic-selections')).toHaveLength(0);
    expect(byClass(root, 'agentic-cursor-ripple')).toHaveLength(0);
    expect(byClass(root, 'agentic-cursor')).toHaveLength(1);
  });

  it('outlines selected objects in screen coordinates and the cursor color', () => {
    objects.set('a', createObject('a', 0, 0, 10, 5));
    cursors = [createCursor({ selectedObjectIds: ['a', 'missing'] })];

    const root = component.render() as unknown as VNode;
    const polygons = byClass(root, 'agentic-selection');
    expect(polygons).toHaveLength(1);
    expect(polygons[0].$attrs$!.points).toBe('5,0 25,0 25,10 5,10');
    expect(polygons[0].$attrs$!['data-cursor-id']).toBe('agent');
    expect(polygons[0].$attrs$!['data-object-id']).toBe('a');
    expect(polygons[0].$attrs$!.style).toEqual({ '--agentic-cursor-color': '#7C3AED' });
    expect(byClass(root, 'agentic-cursor')).toHaveLength(1);
  });

  it('hides the outlines of hidden cursors', () => {
    objects.set('a', createObject('a', 0, 0, 10, 5));
    cursors = [createCursor({ selectedObjectIds: ['a'], visible: false })];
    expect(byClass(component.render() as unknown as VNode, 'agentic-selection')).toHaveLength(0);
  });

  it('marks pressed cursors and re-keys the ripple per press', () => {
    cursors = [createCursor({ isPressed: true, pressCount: 3 })];
    const root = component.render() as unknown as VNode;
    expect(byClass(root, 'agentic-cursor')[0].$attrs$!.class).toContain('is-pressed');
    const ripple = byClass(root, 'agentic-cursor-ripple');
    expect(ripple).toHaveLength(1);
    expect(ripple[0].$key$).toBe('agentic-cursor-ripple-3');
  });

  it('does not replay a ripple that has played, or one from before the cursor was first rendered', () => {
    cursors = [createCursor({ pressCount: 2 })];
    expect(byClass(component.render() as unknown as VNode, 'agentic-cursor-ripple')).toHaveLength(0);

    cursors = [createCursor({ pressCount: 3, isPressed: true })];
    const ripple = byClass(component.render() as unknown as VNode, 'agentic-cursor-ripple');
    expect(ripple).toHaveLength(1);

    // Released; the ripple keeps playing until its animation ends, then is never rendered again.
    cursors = [createCursor({ pressCount: 3 })];
    expect(byClass(component.render() as unknown as VNode, 'agentic-cursor-ripple')).toHaveLength(1);
    (ripple[0].$attrs$!.onAnimationEnd as () => void)();
    expect(byClass(component.render() as unknown as VNode, 'agentic-cursor-ripple')).toHaveLength(0);
  });

  it('moves outlines with their objects on each frame without re-rendering', () => {
    objects.set('a', createObject('a', 0, 0, 10, 5));
    cursors = [createCursor({ selectedObjectIds: ['a'] })];
    const root = component.render() as unknown as VNode;
    const polygon = byClass(root, 'agentic-selection')[0];
    const element = { setAttribute: jest.fn() };
    (polygon.$attrs$!.ref as (el: unknown) => void)(element);

    objects.set('a', createObject('a', 10, 0, 10, 5));
    const versionBefore = component.version;
    frameListener!();

    expect(element.setAttribute).toHaveBeenCalledWith('points', '25,0 45,0 45,10 25,10');
    expect(component.version).toBe(versionBefore);
  });

  it('re-renders when the set of outlines changes', () => {
    objects.set('a', createObject('a', 0, 0, 10, 5));
    component.render();
    cursors = [createCursor({ selectedObjectIds: ['a'] })];
    const versionBefore = component.version;
    frameListener!();
    expect(component.version).toBe(versionBefore + 1);
  });

  it("draws collaborators' agents next to local ones without mixing up equal IDs", () => {
    objects.set('a', createObject('a', 0, 0, 10, 5));
    const remote = { ...createCursor({ selectedObjectIds: ['a'], status: 'Remote work' }), key: 'r:7:agent', clientId: 7, isRemote: true };
    (component.core as any).remoteAgentManager = { getAll: () => [remote], onChange: () => () => undefined, onFrame: () => () => undefined };

    const root = component.render() as unknown as VNode;
    const drawn = flatten(root).filter(node => node.$attrs$?.['data-cursor-id'] === 'agent' && node.$key$?.startsWith('agentic-cursor-'));

    expect(drawn.map(node => node.$key$)).toEqual(['agentic-cursor-agent', 'agentic-cursor-r:7:agent']);
    expect(byClass(root, 'is-remote').length).toBeGreaterThanOrEqual(2); // the cursor and its dashed outline
    expect(byClass(root, 'agentic-cursor-status-text')[0].$children$?.[0]).toMatchObject({ $text$: 'Remote work' });
  });

  it('keeps the status element when the status text changes, so it does not animate in again', () => {
    cursors = [createCursor({ status: 'One' })];
    const first = byClass(component.render() as unknown as VNode, 'agentic-cursor-status')[0];
    cursors = [createCursor({ status: 'Two' })];
    const second = byClass(component.render() as unknown as VNode, 'agentic-cursor-status')[0];

    expect(first.$key$).toBe('status');
    expect(second.$key$).toBe('status');
  });
});
