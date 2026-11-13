import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { UpdrawAgenticCursorManager } from './agentic-cursor.manager';
import { UpdrawAgenticActionManager } from './agentic-action.manager';
import { UpdrawAgentManager } from './agent.manager';
import { UpdrawAgentBroadcaster, AGENT_BROADCAST_INTERVAL_MS, AGENT_BROADCAST_MAX_IDS } from './agent-broadcast.manager';
import { UpdrawRemoteAgentManager } from './remote-agent.manager';
import { UpdrawAgent } from '../agent/agent.class';

const flushMicrotasks = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

/** A core with the real agent managers and an object map that only records `setLocalAgents`. */
const createCore = () => {
  const map = { hasAwareness: true, setLocalAgents: jest.fn(), findById: jest.fn() };
  const core: any = {
    store: {
      state: { scale: 1, translateX: 0, translateY: 0, viewportWidth: 1000, viewportHeight: 1000 },
      get objects() {
        return map;
      },
    },
  };
  core.agenticCursorManager = new UpdrawAgenticCursorManager(core);
  core.agenticActionManager = new UpdrawAgenticActionManager(core);
  core.agentManager = new UpdrawAgentManager(core);
  core.agentBroadcaster = new UpdrawAgentBroadcaster(core);
  core.remoteAgentManager = new UpdrawRemoteAgentManager(core);
  return { core, map };
};

const sentAgents = (map: { setLocalAgents: jest.Mock }) => map.setLocalAgents.mock.calls.at(-1)?.[0];

describe('agent presence', () => {
  let now: number;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'performance'] });
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('UpdrawAgentBroadcaster', () => {
    it('sends added agents at once with what collaborators need', async () => {
      const { core, map } = createCore();
      core.agentBroadcaster.start();
      core.agentManager.add(new UpdrawAgent({ id: 'writer', name: 'Writer', color: '#7C3AED', avatarUrl: '/w.png', status: 'Drafting', position: { x: 10.04, y: 20 } }));
      await flushMicrotasks();

      expect(sentAgents(map)).toEqual([
        {
          id: 'writer',
          name: 'Writer',
          color: '#7C3AED',
          avatarUrl: '/w.png',
          status: 'Drafting',
          visible: true,
          activeAction: null,
          queueLength: 0,
          position: { x: 10, y: 20 },
          attachedTo: null,
          isPressed: false,
          pressCount: 0,
          selectedObjectIds: [],
          claimedObjectIds: [],
        },
      ]);
    });

    it('leaves out agents with broadcast off and removes them when it is turned off', async () => {
      const { core, map } = createCore();
      core.agentBroadcaster.start();
      const shared = core.agentManager.add(new UpdrawAgent({ id: 'shared', name: 'Shared' }));
      core.agentManager.add(new UpdrawAgent({ id: 'private', name: 'Private', broadcast: false }));
      await flushMicrotasks();
      expect(sentAgents(map).map((agent: { id: string }) => agent.id)).toEqual(['shared']);

      shared.broadcast = false;
      await flushMicrotasks();

      expect(sentAgents(map)).toEqual([]);
    });

    it('throttles motion to one update per interval and sends nothing while idle', async () => {
      const { core, map } = createCore();
      core.agentBroadcaster.start();
      const agent = core.agentManager.add(new UpdrawAgent({ id: 'a', name: 'A', position: { x: 0, y: 0 } }));
      await flushMicrotasks();
      const afterAdd = map.setLocalAgents.mock.calls.length;

      for (let step = 1; step <= 5; step++) {
        now += 16;
        core.agenticCursorManager.setPosition('a', { x: step * 10, y: 0 });
        core.agenticCursorManager.tick(now);
      }
      expect(map.setLocalAgents.mock.calls.length).toBe(afterAdd);

      now += AGENT_BROADCAST_INTERVAL_MS;
      jest.advanceTimersByTime(AGENT_BROADCAST_INTERVAL_MS);
      expect(map.setLocalAgents.mock.calls.length).toBe(afterAdd + 1);
      expect(sentAgents(map)[0].position).toEqual({ x: 50, y: 0 });

      // Idle frames: the payload doesn't change, nothing is sent.
      for (let frame = 0; frame < 20; frame++) {
        now += 16;
        core.agenticCursorManager.tick(now);
        jest.advanceTimersByTime(16);
      }
      expect(map.setLocalAgents.mock.calls.length).toBe(afterAdd + 1);
      expect(agent.state.position).toEqual({ x: 50, y: 0 });
    });

    it('caps statuses and object lists', async () => {
      const { core, map } = createCore();
      core.agentBroadcaster.start();
      core.agentManager.add(new UpdrawAgent({ id: 'a', name: 'A', status: 'x'.repeat(500) }));
      core.agenticCursorManager.setSelectedObjectIds('a', Array.from({ length: 200 }, (_, index) => `o${index}`));
      await flushMicrotasks();
      now += AGENT_BROADCAST_INTERVAL_MS;
      jest.advanceTimersByTime(AGENT_BROADCAST_INTERVAL_MS);

      const [payload] = sentAgents(map);
      expect(payload.status).toHaveLength(200);
      expect(payload.selectedObjectIds).toHaveLength(AGENT_BROADCAST_MAX_IDS);
      expect(JSON.stringify(sentAgents(map)).length).toBeLessThan(2000);
    });

    it('sends status changes through the throttle, but renames at once', async () => {
      const { core, map } = createCore();
      core.agentBroadcaster.start();
      const agent = core.agentManager.add(new UpdrawAgent({ id: 'a', name: 'A' }));
      await flushMicrotasks();
      const afterAdd = map.setLocalAgents.mock.calls.length;

      for (let step = 0; step < 20; step++) {
        now += 5;
        agent.setStatus(`Step ${step}`);
        await flushMicrotasks();
        jest.advanceTimersByTime(5);
      }
      now += AGENT_BROADCAST_INTERVAL_MS;
      jest.advanceTimersByTime(AGENT_BROADCAST_INTERVAL_MS);

      expect(map.setLocalAgents.mock.calls.length - afterAdd).toBeLessThanOrEqual(2);
      expect(sentAgents(map)[0].status).toBe('Step 19');

      agent.name = 'Renamed';
      await flushMicrotasks();
      expect(sentAgents(map)[0].name).toBe('Renamed');
    });

    it('shares a cursor that sticks to an element inside an object by its position', async () => {
      const { core, map } = createCore();
      const tracked = new Set<string>();
      map.findById.mockReturnValue({
        id: 'frame',
        rotation: 0,
        boundingBox: { x: 100, y: 100, width: 200, height: 100 },
        isElementPicking: false,
        setElementPicking: jest.fn(),
        setElementHighlights: jest.fn(),
        getElementHighlights: jest.fn(() => []),
        refreshElementTheme: jest.fn(),
        queryElements: jest.fn(async () => []),
        trackElement: (selector: string) => tracked.add(selector),
        untrackElement: (selector: string) => tracked.delete(selector),
        getTrackedElementRect: (selector: string) => (tracked.has(selector) ? { x: 10, y: 20, width: 20, height: 10 } : null),
        contentToObjectLocal: (point: { x: number; y: number }) => point,
      });
      core.agentBroadcaster.start();
      const agent = core.agentManager.add(new UpdrawAgent({ id: 'player', name: 'Player', position: { objectId: 'frame', selector: '#play' } }));
      await flushMicrotasks();

      expect(agent.state.attachedTo).toEqual({ objectId: 'frame', selector: '#play', anchor: 'center', offset: { x: 0, y: 0 } });
      expect(sentAgents(map)[0]).toMatchObject({ id: 'player', attachedTo: null, position: { x: 120, y: 125 } });
    });

    it('clears the field and sends again after a workspace switch', async () => {
      const { core, map } = createCore();
      core.agentBroadcaster.start();
      core.agentManager.add(new UpdrawAgent({ id: 'a', name: 'A' }));
      await flushMicrotasks();

      core.agentBroadcaster.clear();
      expect(sentAgents(map)).toBeNull();

      core.agentBroadcaster.reset();
      expect(sentAgents(map)).toHaveLength(1);
    });
  });

  describe('UpdrawRemoteAgentManager', () => {
    const remoteAgent = (overrides: Record<string, unknown> = {}) => ({
      id: 'writer',
      name: 'Writer',
      color: '#7C3AED',
      status: 'Drafting',
      visible: true,
      activeAction: 'moveObject',
      queueLength: 1,
      position: { x: 0, y: 0 },
      attachedTo: null,
      isPressed: false,
      pressCount: 2,
      selectedObjectIds: ['sel'],
      claimedObjectIds: ['claim'],
      ...overrides,
    });

    it('lists the agents of other clients, keyed per client, with their host user', () => {
      const { core } = createCore();
      const states = new Map<number, Record<string, unknown>>([
        [1, { user: { id: 'me' }, agents: [remoteAgent()] }],
        [2, { user: { id: 'ana', displayName: 'Ana' }, agents: [remoteAgent()] }],
        [3, { user: { id: 'bo' }, agents: [remoteAgent({ id: 'reviewer', name: 'Reviewer' })] }],
      ]);

      core.remoteAgentManager.handleAwarenessStates(states, 1);

      expect(core.remoteAgentManager.getAll().map((cursor: { key: string }) => cursor.key)).toEqual(['r:2:writer', 'r:3:reviewer']);
      expect(core.remoteAgentManager.getPresences()[0]).toMatchObject({
        id: 'writer',
        kind: 'agent',
        isRemote: true,
        clientId: 2,
        status: 'Drafting',
        activeAction: 'moveObject',
        hostUser: { id: 'ana', displayName: 'Ana' },
      });
    });

    it('ignores malformed agents and drops agents that are gone', () => {
      const { core } = createCore();
      const change = jest.fn();
      core.remoteAgentManager.onChange(change);

      core.remoteAgentManager.handleAwarenessStates(
        new Map([[2, { agents: [remoteAgent(), { id: 'broken' }, null, remoteAgent({ id: 'x', position: { x: 'a', y: 1 } })] }]]),
        1,
      );
      expect(core.remoteAgentManager.getAll()).toHaveLength(1);

      core.remoteAgentManager.handleAwarenessStates(new Map([[2, { agents: null }]]), 1);
      expect(core.remoteAgentManager.getAll()).toHaveLength(0);
      expect(change).toHaveBeenCalledTimes(2);
    });

    it('keeps only http(s), data:image and relative avatar URLs', () => {
      const { core } = createCore();
      const urls = ['https://example.com/a.png', '/avatars/b.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd'];
      core.remoteAgentManager.handleAwarenessStates(
        new Map([[2, { agents: urls.map((avatarUrl, index) => remoteAgent({ id: `a${index}`, avatarUrl })) }]]),
        1,
      );

      expect(core.remoteAgentManager.getPresences().map((agent: { avatarUrl?: string }) => agent.avatarUrl ?? null)).toEqual([
        'https://example.com/a.png',
        '/avatars/b.png',
        'data:image/png;base64,AAAA',
        null,
        null,
        null,
      ]);
    });

    it("blocks agents on remote agents' claims and selections, and references only on claims", () => {
      const { core } = createCore();
      core.remoteAgentManager.handleAwarenessStates(new Map([[2, { agents: [remoteAgent()] }]]), 1);

      expect(core.remoteAgentManager.isClaimed('claim', 'reference')).toBe(true);
      expect(core.remoteAgentManager.isClaimed('sel', 'target')).toBe(true);
      expect(core.remoteAgentManager.isClaimed('sel', 'reference')).toBe(false);
      expect(core.agenticActionManager.isClaimedByOtherAgent('claim', 'local-agent')).toBe(true);
    });

    it('falls back to the center for anchors it does not know and keeps the other cursors moving', () => {
      const { core, map } = createCore();
      map.findById.mockReturnValue({ rotation: 0, boundingBox: { x: 0, y: 0, width: 100, height: 100 } });
      const frame = jest.fn();
      core.remoteAgentManager.onFrame(frame);
      core.remoteAgentManager.handleAwarenessStates(
        new Map([[2, { agents: [remoteAgent({ attachedTo: { objectId: 'shape', anchor: 'toString', offset: { x: 0, y: 0 } } }), remoteAgent({ id: 'other' })] }]]),
        1,
      );

      expect(() => core.remoteAgentManager.tick(now + 1)).not.toThrow();
      expect(frame).toHaveBeenCalled();
      expect(core.remoteAgentManager.getAll()[0]).toMatchObject({ attachedTo: { anchor: 'center' }, position: { x: 50, y: 50 } });
    });

    it('follows the position of a cursor that sticks to an element instead of the anchor of its object', () => {
      const { core, map } = createCore();
      map.findById.mockReturnValue({ rotation: 0, boundingBox: { x: 0, y: 0, width: 100, height: 100 } });
      core.remoteAgentManager.handleAwarenessStates(
        new Map([[2, { agents: [remoteAgent({ position: { x: 20, y: 30 }, attachedTo: { objectId: 'frame', selector: '#play', anchor: 'center', offset: { x: 0, y: 0 } } })] }]]),
        1,
      );

      core.remoteAgentManager.tick(now + AGENT_BROADCAST_INTERVAL_MS);

      expect(core.remoteAgentManager.getAll()[0]).toMatchObject({ attachedTo: null, position: { x: 20, y: 30 } });
    });

    it('glides to new positions within one update interval', () => {
      const { core } = createCore();
      core.remoteAgentManager.handleAwarenessStates(new Map([[2, { agents: [remoteAgent()] }]]), 1);

      core.remoteAgentManager.handleAwarenessStates(new Map([[2, { agents: [remoteAgent({ position: { x: 100, y: 0 } })] }]]), 1);
      core.remoteAgentManager.tick(now + AGENT_BROADCAST_INTERVAL_MS / 2);
      expect(core.remoteAgentManager.getAll()[0].position.x).toBeCloseTo(50);

      core.remoteAgentManager.tick(now + AGENT_BROADCAST_INTERVAL_MS);
      expect(core.remoteAgentManager.getAll()[0].position).toEqual({ x: 100, y: 0 });
    });

    it('keeps an attached cursor on its object locally', () => {
      const { core, map } = createCore();
      map.findById.mockReturnValue({ rotation: 0, translateX: 0, translateY: 0, boundingBox: { x: 500, y: 300, width: 100, height: 50 }, rotatedBoundingBox: { x: 500, y: 300, width: 100, height: 50 } });
      const resolve = jest.spyOn(core.agenticCursorManager, 'resolveTarget').mockReturnValue({ x: 550, y: 325 });
      core.remoteAgentManager.handleAwarenessStates(
        new Map([[2, { agents: [remoteAgent({ attachedTo: { objectId: 'shape', anchor: 'center', offset: { x: 0, y: 0 } } })] }]]),
        1,
      );

      core.remoteAgentManager.tick(now + 1);

      expect(resolve).toHaveBeenCalledWith({ objectId: 'shape', anchor: 'center', offset: { x: 0, y: 0 } });
      expect(core.remoteAgentManager.getAll()[0].position).toEqual({ x: 550, y: 325 });
    });
  });

  it('carries agents from one client to another through y-protocols awareness', async () => {
    const [docA, docB] = [new Y.Doc(), new Y.Doc()];
    const [awarenessA, awarenessB] = [new Awareness(docA), new Awareness(docB)];
    // Wire the two awareness instances like a network provider would.
    awarenessA.on('update', ({ added, updated, removed }: any, origin: unknown) => {
      if (origin !== 'remote') applyAwarenessUpdate(awarenessB, encodeAwarenessUpdate(awarenessA, [...added, ...updated, ...removed]), 'remote');
    });
    const sender = createCore();
    sender.map.setLocalAgents.mockImplementation((agents: unknown) => awarenessA.setLocalStateField('agents', agents));
    sender.core.agentBroadcaster.start();
    const receiver = createCore();

    sender.core.agentManager.add(new UpdrawAgent({ id: 'writer', name: 'Writer', status: 'Hi' }));
    await flushMicrotasks();
    receiver.core.remoteAgentManager.handleAwarenessStates(awarenessB.getStates(), docB.clientID);
    expect(receiver.core.remoteAgentManager.getPresences()).toEqual([expect.objectContaining({ id: 'writer', status: 'Hi', isRemote: true, clientId: docA.clientID })]);

    removeAwarenessStates(awarenessA, [docA.clientID], 'test');
    receiver.core.remoteAgentManager.handleAwarenessStates(awarenessB.getStates(), docB.clientID);
    expect(receiver.core.remoteAgentManager.getAll()).toHaveLength(0);

    awarenessA.destroy();
    awarenessB.destroy();
  });
});
