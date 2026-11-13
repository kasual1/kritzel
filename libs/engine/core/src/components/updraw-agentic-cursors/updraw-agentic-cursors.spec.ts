/** Tasks queued for Stencil's write phase; `flushWrites()` runs them like the next frame would. */
const mockWrites: (() => void)[] = [];

jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  writeTask: (task: () => void) => mockWrites.push(task),
}));

import { UpdrawAgenticCursors } from './updraw-agentic-cursors';
import { UpdrawLine } from '@updraw/core';
import type { UpdrawAgenticCursor, UpdrawCore } from '@updraw/core';

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

const flushWrites = () => mockWrites.splice(0).forEach(task => task());

const createCursor = (overrides: Partial<UpdrawAgenticCursor> = {}): UpdrawAgenticCursor => ({
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

describe('UpdrawAgenticCursors', () => {
  let component: UpdrawAgenticCursors;
  let cursors: UpdrawAgenticCursor[];
  let objects: Map<string, any>;
  let changeListener: (() => void) | null;
  let frameListener: (() => void) | null;
  let state: any;
  let unsubscribeChange: jest.Mock;
  let unsubscribeFrame: jest.Mock;
  let isRotatable: jest.Mock;

  const createObject = (id: string, x: number, y: number, width: number, height: number) => ({
    id,
    rotatedPolygon: {
      topLeft: { x, y },
      topRight: { x: x + width, y },
      bottomRight: { x: x + width, y: y + height },
      bottomLeft: { x, y: y + height },
    },
    // Unrotated, as the cursor manager resolves it: 15 screen pixels above the middle of the top edge.
    rotationHandle: () => ({ base: { x: x + width / 2, y }, handle: { x: x + width / 2, y: y - 15 / state.scale } }),
  });

  const handleParts = (root: VNode) => ({
    groups: byClass(root, 'agentic-rotation-handle'),
    stems: byClass(root, 'agentic-rotation-handle-stem'),
    knobs: byClass(root, 'agentic-rotation-handle-knob'),
  });

  beforeEach(() => {
    mockWrites.length = 0;
    cursors = [createCursor()];
    objects = new Map();
    state = { scale: 2, translateX: 5, translateY: 0, viewportWidth: 1000, viewportHeight: 800 };
    unsubscribeChange = jest.fn();
    unsubscribeFrame = jest.fn();
    isRotatable = jest.fn(() => true);
    const core = {
      store: {
        state,
        objects: { findById: (id: string) => objects.get(id) },
      },
      objectConfigManager: { isRotatable },
      agenticCursorManager: {
        getAll: () => cursors,
        getRotationHandle: (id: string) => objects.get(id)?.rotationHandle() ?? null,
        onChange: (listener: () => void) => {
          changeListener = listener;
          return unsubscribeChange;
        },
        onFrame: (listener: () => void) => {
          frameListener = listener;
          return unsubscribeFrame;
        },
      },
    } as unknown as UpdrawCore;

    component = new UpdrawAgenticCursors();
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
    isRotatable.mockReturnValue(false);
    objects.set('a', createObject('a', 0, 0, 10, 5));
    cursors = [createCursor({ selectedObjectIds: ['a'] })];
    const root = component.render() as unknown as VNode;
    const polygon = byClass(root, 'agentic-selection')[0];
    const element = { setAttribute: jest.fn() };
    (polygon.$attrs$!.ref as (el: unknown) => void)(element);

    objects.set('a', createObject('a', 10, 0, 10, 5));
    const versionBefore = component.version;
    frameListener!();
    flushWrites();

    expect(element.setAttribute).toHaveBeenCalledWith('points', '25,0 45,0 45,10 25,10');
    expect(component.version).toBe(versionBefore);
  });

  it('draws a frame in the write phase, where the engine renders objects, once for both frame loops', () => {
    isRotatable.mockReturnValue(false);
    objects.set('a', createObject('a', 0, 0, 10, 5));
    cursors = [createCursor({ selectedObjectIds: ['a'] })];
    const polygon = byClass(component.render() as unknown as VNode, 'agentic-selection')[0];
    const element = { setAttribute: jest.fn() };
    (polygon.$attrs$!.ref as (el: unknown) => void)(element);

    // An agent action moves the object in the cursor loop; the local and the remote loop both report the frame.
    objects.set('a', createObject('a', 10, 0, 10, 5));
    frameListener!();
    frameListener!();
    expect(mockWrites).toHaveLength(1);
    expect(element.setAttribute).not.toHaveBeenCalled();

    // The object moves again before the write phase: the outline follows the state the engine renders.
    objects.set('a', createObject('a', 20, 0, 10, 5));
    flushWrites();
    expect(element.setAttribute).toHaveBeenCalledTimes(1);
    expect(element.setAttribute).toHaveBeenCalledWith('points', '45,0 65,0 65,10 45,10');

    frameListener!();
    expect(mockWrites).toHaveLength(1);
  });

  it('skips a queued frame after disconnecting', () => {
    isRotatable.mockReturnValue(false);
    objects.set('a', createObject('a', 0, 0, 10, 5));
    cursors = [createCursor({ selectedObjectIds: ['a'] })];
    const polygon = byClass(component.render() as unknown as VNode, 'agentic-selection')[0];
    const element = { setAttribute: jest.fn() };
    (polygon.$attrs$!.ref as (el: unknown) => void)(element);

    objects.set('a', createObject('a', 10, 0, 10, 5));
    frameListener!();
    component.disconnectedCallback();
    const versionBefore = component.version;
    flushWrites();

    expect(element.setAttribute).not.toHaveBeenCalled();
    expect(component.version).toBe(versionBefore);
  });

  it('re-renders when the set of outlines changes', () => {
    objects.set('a', createObject('a', 0, 0, 10, 5));
    component.render();
    cursors = [createCursor({ selectedObjectIds: ['a'] })];
    const versionBefore = component.version;
    frameListener!();
    flushWrites();
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

  describe('rotation handle', () => {
    it('shows the handle of a single selected object in screen coordinates and the cursor color', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      cursors = [createCursor({ selectedObjectIds: ['a'] })];

      const { groups, stems, knobs } = handleParts(component.render() as unknown as VNode);

      expect(groups).toHaveLength(1);
      expect(groups[0].$attrs$!['data-cursor-id']).toBe('agent');
      expect(groups[0].$attrs$!['data-object-id']).toBe('a');
      expect(groups[0].$attrs$!.style).toEqual({ '--agentic-cursor-color': '#7C3AED' });
      expect(stems[0].$attrs$).toMatchObject({ x1: 15, y1: 0, x2: 15, y2: -15 });
      // The engine's handle size (6px by default) minus one, like the user's rotation handle.
      expect(knobs[0].$attrs$).toMatchObject({ cx: 15, cy: -15, r: 5 });
    });

    it('shows no handle for several objects, lines and objects that cannot rotate', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      objects.set('b', createObject('b', 20, 0, 10, 5));
      objects.set('line', Object.setPrototypeOf(createObject('line', 40, 0, 10, 5), UpdrawLine.prototype));

      cursors = [createCursor({ selectedObjectIds: ['a', 'b'] })];
      expect(handleParts(component.render() as unknown as VNode).groups).toHaveLength(0);
      expect(byClass(component.render() as unknown as VNode, 'agentic-selection')).toHaveLength(2);

      cursors = [createCursor({ selectedObjectIds: ['line'] })];
      expect(handleParts(component.render() as unknown as VNode).groups).toHaveLength(0);

      isRotatable.mockReturnValue(false);
      cursors = [createCursor({ selectedObjectIds: ['a'] })];
      expect(handleParts(component.render() as unknown as VNode).groups).toHaveLength(0);
      expect(isRotatable).toHaveBeenCalledWith(objects.get('a'));
    });

    it('shows the handle of the object an agent rotates, even a line', () => {
      objects.set('line', Object.setPrototypeOf(createObject('line', 0, 0, 10, 5), UpdrawLine.prototype));
      cursors = [createCursor({ selectedObjectIds: ['line'], activeAction: 'rotateObject' })];
      expect(handleParts(component.render() as unknown as VNode).groups).toHaveLength(1);
    });

    it('hides the handles of hidden cursors', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      cursors = [createCursor({ selectedObjectIds: ['a'], visible: false })];
      expect(handleParts(component.render() as unknown as VNode).groups).toHaveLength(0);
    });

    it('moves the handle with its object on each frame without re-rendering', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      cursors = [createCursor({ selectedObjectIds: ['a'] })];
      const root = component.render() as unknown as VNode;
      const { stems, knobs } = handleParts(root);
      const stem = { setAttribute: jest.fn() };
      const knob = { setAttribute: jest.fn() };
      (byClass(root, 'agentic-selection')[0].$attrs$!.ref as (el: unknown) => void)({ setAttribute: jest.fn() });
      (stems[0].$attrs$!.ref as (el: unknown) => void)(stem);
      (knobs[0].$attrs$!.ref as (el: unknown) => void)(knob);

      objects.set('a', createObject('a', 10, 0, 10, 5));
      const versionBefore = component.version;
      frameListener!();
      flushWrites();

      expect(stem.setAttribute).toHaveBeenCalledWith('x1', '35');
      expect(stem.setAttribute).toHaveBeenCalledWith('x2', '35');
      expect(knob.setAttribute).toHaveBeenCalledWith('cx', '35');
      expect(knob.setAttribute).toHaveBeenCalledWith('cy', '-15');
      expect(component.version).toBe(versionBefore);

      stem.setAttribute.mockClear();
      frameListener!();
      flushWrites();
      expect(stem.setAttribute).not.toHaveBeenCalled();
    });

    it('re-renders when a handle appears or goes away', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      objects.set('b', createObject('b', 20, 0, 10, 5));
      cursors = [createCursor({ selectedObjectIds: ['a', 'b'] })];
      component.render();

      cursors = [createCursor({ selectedObjectIds: ['a'] })];
      const versionBefore = component.version;
      frameListener!();
      flushWrites();
      expect(component.version).toBe(versionBefore + 1);
    });

    it('keeps the handle under the cursor while the agent turns it', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      // A collaborator's agent grabbed the handle at another zoom: 20 world units above the edge, not 7.5.
      const holding = { selectedObjectIds: ['a'], activeAction: 'rotateObject' as const, position: { x: 5.4, y: -20 } };

      cursors = [createCursor({ ...holding, isPressed: true })];
      const { stems, knobs } = handleParts(component.render() as unknown as VNode);
      expect(stems[0].$attrs$).toMatchObject({ x1: 15, y1: 0, x2: 15, y2: -40 });
      expect(knobs[0].$attrs$).toMatchObject({ cx: 15, cy: -40 });

      // Not grabbed yet: at its own distance.
      cursors = [createCursor({ ...holding, isPressed: false })];
      expect(handleParts(component.render() as unknown as VNode).knobs[0].$attrs$).toMatchObject({ cx: 15, cy: -15 });
    });

    it('stays under a cursor that rests on it after turning, and only then', () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      const resting = { objectId: 'a', anchor: 'top' as const, offset: { x: 0, y: -20 } };
      cursors = [createCursor({ selectedObjectIds: ['a'], attachedTo: resting, position: { x: 5, y: -20 } })];
      expect(handleParts(component.render() as unknown as VNode).knobs[0].$attrs$).toMatchObject({ cx: 15, cy: -40 });

      // Attached elsewhere on the object: the handle keeps its own distance.
      cursors = [createCursor({ selectedObjectIds: ['a'], attachedTo: { ...resting, anchor: 'center' }, position: { x: 5, y: -20 } })];
      expect(handleParts(component.render() as unknown as VNode).knobs[0].$attrs$).toMatchObject({ cx: 15, cy: -15 });
      cursors = [createCursor({ selectedObjectIds: ['a'], attachedTo: { ...resting, offset: { x: 3, y: -20 } }, position: { x: 8, y: -20 } })];
      expect(handleParts(component.render() as unknown as VNode).knobs[0].$attrs$).toMatchObject({ cx: 15, cy: -15 });
    });

    it("shows the handles of collaborators' agents", () => {
      objects.set('a', createObject('a', 0, 0, 10, 5));
      cursors = [];
      const remote = { ...createCursor({ selectedObjectIds: ['a'] }), key: 'r:7:agent', clientId: 7, isRemote: true };
      (component.core as any).remoteAgentManager = { getAll: () => [remote], onChange: () => () => undefined, onFrame: () => () => undefined };

      const { groups } = handleParts(component.render() as unknown as VNode);

      expect(groups).toHaveLength(1);
      expect(groups[0].$key$).toBe('agentic-rotation-handle-r:7:agent:a');
      expect(groups[0].$attrs$!.class).toContain('is-remote');
    });
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
