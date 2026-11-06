import { KritzelSelectionGroup } from '../../objects/selection-group.class';
import { buildFrameCache, classifySelectionGroup, detectObjectConflict } from './agentic-conflict.helper';

const createGroup = (fields: Record<string, unknown>) => {
  const group = Object.create(KritzelSelectionGroup.prototype);
  for (const [key, value] of Object.entries({ objectIds: [], ...fields })) {
    Object.defineProperty(group, key, { value, writable: true, configurable: true });
  }
  return group as KritzelSelectionGroup;
};

const createMap = (objects: any[], options: { docClientId?: number; awareness?: Map<number, any>; localClientId?: number } = {}) => ({
  docClientId: options.docClientId ?? 1,
  localClientId: options.localClientId ?? null,
  awareness: options.awareness ? { getStates: () => options.awareness } : null,
  localActiveDrawingObjectId: null,
  filter: (predicate: (o: any) => boolean) => objects.filter(predicate),
  findById: (id: string) => objects.find(o => o.id === id),
});

const createCore = (state: Record<string, unknown> = {}, user?: { id: string }) => ({
  user,
  store: { state: { isDragging: false, isResizing: false, isRotating: false, ...state } },
  objectTitlebarManager: { editingTitle: null },
});

describe('agentic conflict helpers', () => {
  describe('classifySelectionGroup', () => {
    it('recognizes this tab by its doc client ID', () => {
      const map = createMap([], { docClientId: 5 });
      expect(classifySelectionGroup(map as any, createCore() as any, createGroup({ clientId: 5 }))).toBe('human');
    });

    it('treats groups of present awareness clients as collaborators and others as stale', () => {
      const awareness = new Map<number, any>([[1, {}], [9, {}]]);
      const map = createMap([], { docClientId: 1, awareness });
      expect(classifySelectionGroup(map as any, createCore() as any, createGroup({ clientId: 9 }))).toBe('collaborator');
      expect(classifySelectionGroup(map as any, createCore() as any, createGroup({ clientId: 42 }))).toBe('stale');
    });

    it('treats foreign client IDs as collaborators without awareness', () => {
      const map = createMap([], { docClientId: 1 });
      expect(classifySelectionGroup(map as any, createCore() as any, createGroup({ clientId: 2 }))).toBe('collaborator');
    });

    it('falls back to the user ID for legacy groups without a client ID', () => {
      const map = createMap([], { docClientId: 1 });
      const core = createCore({}, { id: 'me' });
      expect(classifySelectionGroup(map as any, core as any, createGroup({ userId: 'me' }))).toBe('human');
      expect(classifySelectionGroup(map as any, core as any, createGroup({ userId: 'you' }))).toBe('collaborator');
      expect(classifySelectionGroup(map as any, createCore() as any, createGroup({ userId: undefined }))).toBe('human');
    });
  });

  describe('buildFrameCache and detectObjectConflict', () => {
    it('collects collaborator drawings from awareness, ignoring this client', () => {
      const awareness = new Map<number, any>([
        [1, { activeObjectId: 'mine' }],
        [2, { activeObjectId: 'theirs' }],
      ]);
      const objects = [{ id: 'mine' }, { id: 'theirs' }];
      const map = createMap(objects, { docClientId: 1, localClientId: 1, awareness });
      const cache = buildFrameCache(createCore() as any, map as any);
      expect(cache.collaboratorIds.has('theirs')).toBe(true);
      expect(cache.collaboratorIds.has('mine')).toBe(false);
      expect(cache.hasRemotePeers).toBe(true);
    });

    it('distinguishes a selected object from one being transformed', () => {
      const objects: any[] = [{ id: 'a' }];
      objects.push(createGroup({ id: 'sg', clientId: 1, objectIds: ['a'] }));
      const map = createMap(objects, { docClientId: 1 });
      const idle = buildFrameCache(createCore() as any, map as any);
      expect(detectObjectConflict(createCore() as any, map as any, idle, 'a', undefined, false)).toBe('user-selected');
      const dragging = buildFrameCache(createCore({ isDragging: true }) as any, map as any);
      expect(detectObjectConflict(createCore({ isDragging: true }) as any, map as any, dragging, 'a', undefined, false)).toBe('user-interaction');
    });

    it('detects removal, replacement, local edits, remote edits and claims in order', () => {
      const a: any = { id: 'a' };
      const map = createMap([a], { docClientId: 1, awareness: new Map([[1, {}], [2, {}]]) });
      const core = createCore();
      const cache = buildFrameCache(core as any, map as any);
      expect(detectObjectConflict(core as any, map as any, cache, 'missing', undefined, false)).toBe('object-removed');
      expect(detectObjectConflict(core as any, map as any, cache, 'a', { id: 'a' } as any, false)).toBe('conflict');
      a.isEditing = true;
      a.uneditedObject = {};
      expect(detectObjectConflict(core as any, map as any, cache, 'a', a, false)).toBe('user-interaction');
      a.uneditedObject = null;
      expect(detectObjectConflict(core as any, map as any, cache, 'a', a, false)).toBe('collaborator-editing');
      a.isEditing = false;
      expect(detectObjectConflict(core as any, map as any, cache, 'a', a, true)).toBe('claimed-by-agent');
      expect(detectObjectConflict(core as any, map as any, cache, 'a', a, false)).toBeNull();
    });

    it('ignores a serialized edit flag when no other client is present', () => {
      const a: any = { id: 'a', isEditing: true, uneditedObject: null };
      const map = createMap([a], { docClientId: 1 });
      const core = createCore();
      expect(detectObjectConflict(core as any, map as any, buildFrameCache(core as any, map as any), 'a', a, false)).toBeNull();
    });
  });
});
