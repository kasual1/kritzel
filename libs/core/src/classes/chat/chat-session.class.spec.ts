import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelAgenticCursorManager } from '../managers/agentic-cursor.manager';
import { KritzelAgenticActionManager } from '../managers/agentic-action.manager';
import { KritzelAgentManager } from '../managers/agent.manager';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelClipboardManager } from '../managers/clipboard.manager';
import { KritzelAgent } from '../agent/agent.class';
import { KritzelChatSession, isKritzelChatSession } from './chat-session.class';
import { createScriptedTransport } from './scripted-transport';
import type { KritzelCore } from '../core/core.class';
import type { KritzelChatMessage, KritzelChatRequest, KritzelChatStreamEvent, KritzelChatToolResultPart } from '../../interfaces/chat-session.interface';

// Chat sessions on a real Yjs object map with real object classes and the real agentic managers.

jest.mock('../../configs/default-sync.config', () => ({ DEFAULT_SYNC_CONFIG: { providers: [] } }));
jest.mock('../../helpers/migration.helper', () => ({ runMigrations: jest.fn() }));

/** Same-realm deep clone: Yjs rejects objects from Jest's structuredClone realm. */
const sameRealmClone = (value: any): any => {
  if (Array.isArray(value)) return value.map(sameRealmClone);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (value[key] !== undefined) result[key] = sameRealmClone(value[key]);
    }
    return result;
  }
  return value;
};

let originalStructuredClone: typeof structuredClone;
beforeAll(() => {
  originalStructuredClone = globalThis.structuredClone;
  (globalThis as any).structuredClone = sameRealmClone;
});
afterAll(() => {
  (globalThis as any).structuredClone = originalStructuredClone;
});

const flushMicrotasks = async () => {
  for (let i = 0; i < 30; i++) {
    await Promise.resolve();
  }
};

const resultsOf = (message: KritzelChatMessage) => message.parts.filter((part): part is KritzelChatToolResultPart => part.type === 'tool-result');

describe('KritzelChatSession', () => {
  let now: number;
  let core: any;
  let map: KritzelObjectMap<any>;

  const createCore = async () => {
    const state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewportWidth: 2000,
      viewportHeight: 2000,
      lockDrawingScale: true,
      activeWorkspace: { id: 'ws' },
      debugInfo: {},
      isDragging: false,
      isResizing: false,
      isRotating: false,
      isSelecting: false,
      isDrawing: false,
      isErasing: false,
      isLineHandleDragging: false,
      isResizeHandleSelected: false,
      isRotationHandleSelected: false,
      isLineHandleSelected: false,
    };
    const objects = new KritzelObjectMap<any>();
    const fakeCore: any = {
      user: { id: 'human' },
      editorId: undefined,
      rerender: jest.fn(),
      store: {
        state,
        get objects() {
          return objects;
        },
        get currentZIndex() {
          return objects.allObjects().length;
        },
        get allObjects() {
          return objects.allObjects();
        },
        selectionGroup: null,
        invalidateSelectionCache: jest.fn(),
      },
      objectConfigManager: { isResizable: jest.fn(() => true), isRotatable: jest.fn(() => true) },
      objectTitlebarManager: { editingTitle: null, isEnabled: false },
      toolRegistry: { getToolByIndex: () => null },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
        emitObjectsInViewportChange: jest.fn(),
        triggerSelectionChange: jest.fn().mockResolvedValue(undefined),
      },
      addObject: (object: any) => objects.insert(object),
      removeObject: (object: any) => objects.remove((o: any) => o.id === object.id),
    };
    fakeCore.anchorManager = new KritzelAnchorManager(fakeCore);
    fakeCore.clipboardManager = new KritzelClipboardManager(fakeCore);
    await objects.initialize(fakeCore as unknown as KritzelCore, 'ws', { providers: [] });
    fakeCore.agenticCursorManager = new KritzelAgenticCursorManager(fakeCore);
    fakeCore.agenticActionManager = new KritzelAgenticActionManager(fakeCore);
    fakeCore.agentManager = new KritzelAgentManager(fakeCore);
    return { fakeCore, objects };
  };

  const step = async () => {
    now += 16;
    core.agenticCursorManager.tick(now);
    await flushMicrotasks();
  };

  const settle = async <T>(promise: Promise<T>, maxFrames = 600): Promise<T> => {
    let done = false;
    promise.then(
      () => (done = true),
      () => (done = true),
    );
    await flushMicrotasks();
    for (let i = 0; i < maxFrames && !done; i++) {
      await step();
    }
    return promise;
  };

  const shapeCall = (x: number, text?: string) => ({ tool: 'create_shape', input: { x, y: 0, width: 100, height: 50, ...(text ? { text } : {}) } });

  beforeEach(async () => {
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    ({ fakeCore: core, objects: map } = await createCore());
  });

  afterEach(() => {
    core.agentManager.getAll().forEach((agent: KritzelAgent) => core.agentManager.remove(agent));
    core.agenticActionManager.cleanup();
    core.agenticCursorManager.cleanup();
    map.destroy();
    jest.restoreAllMocks();
  });

  it('validates its options and brands itself', () => {
    expect(() => new KritzelChatSession({} as any)).toThrow(TypeError);
    expect(() => new KritzelChatSession({ transport: createScriptedTransport(['x']), maxSteps: 0 })).toThrow(TypeError);
    const session = new KritzelChatSession({ transport: createScriptedTransport(['x']) });
    expect(isKritzelChatSession(session)).toBe(true);
    expect(isKritzelChatSession({})).toBe(false);
    expect(session.mode).toBe('user');
  });

  it('answers detached until it is bound to an editor', async () => {
    const session = new KritzelChatSession({ transport: createScriptedTransport(['Hi']) });
    await expect(session.send('Hello')).resolves.toEqual({ status: 'detached' });
    expect(session.messages).toEqual([]);
  });

  describe('working as the user', () => {
    it('runs the tool loop and puts the whole prompt into one step of the user history', async () => {
      const requests: KritzelChatRequest[] = [];
      const script = createScriptedTransport([{ text: 'Drawing two boxes.', toolCalls: [shapeCall(0, 'A'), shapeCall(300, 'B')] }, 'Done.']);
      const session = new KritzelChatSession({
        system: 'Be brief.',
        context: () => ({ board: 'test' }),
        transport: (request, options) => {
          requests.push(request);
          return script(request, options);
        },
      });
      session._attach(core);
      const userSteps = map.undoManager!.undoStack.length;

      const result = await settle(session.send('Draw two boxes'));

      expect(result).toEqual({ status: 'completed' });
      expect(session.messages.map(message => message.role)).toEqual(['user', 'assistant', 'tool', 'assistant']);
      const results = resultsOf(session.messages[2]);
      expect(results).toHaveLength(2);
      expect(JSON.parse(results[0].output)).toMatchObject({ completed: true, objects: [{ type: 'shape', text: 'A', createdBy: 'human' }] });
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 1);

      expect(requests).toHaveLength(2);
      expect(requests[0]).toMatchObject({ version: 1, system: 'Be brief.', mode: 'user', context: { board: 'test' } });
      const names = requests[0].tools.map(tool => tool.name);
      expect(names).toContain('create_shape');
      expect(names).not.toContain('undo');
      expect(requests[1].messages).toHaveLength(3);

      map.undo();
      expect(map.allObjects()).toHaveLength(0);
    });

    it('keeps prompts apart in the user history', async () => {
      const session = new KritzelChatSession({
        transport: createScriptedTransport((request: KritzelChatRequest) =>
          request.messages[request.messages.length - 1].role === 'user' ? { toolCalls: [shapeCall(request.messages.length * 200)] } : 'ok',
        ),
      });
      session._attach(core);
      const userSteps = map.undoManager!.undoStack.length;
      await settle(session.send('one'));
      await settle(session.send('two'));
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 2);
    });

    it('lets one session of an editor run at a time and refuses a second prompt while running', async () => {
      const slow = createScriptedTransport(['slow'], { delayMs: 50 });
      const first = new KritzelChatSession({ transport: slow });
      const second = new KritzelChatSession({ transport: slow });
      first._attach(core);
      second._attach(core);

      jest.useFakeTimers({ doNotFake: ['performance', 'queueMicrotask', 'nextTick'] });
      try {
        const running = first.send('a');
        expect(first.running).toBe(true);
        await expect(first.send('b')).resolves.toEqual({ status: 'busy' });
        await expect(second.send('c')).resolves.toEqual({ status: 'busy' });
        jest.advanceTimersByTime(60);
        await expect(running).resolves.toEqual({ status: 'completed' });
        expect(first.running).toBe(false);
      } finally {
        jest.useRealTimers();
      }
    });

    it('describes chips and images in the user message', async () => {
      const session = new KritzelChatSession({ transport: createScriptedTransport(['ok']) });
      session._attach(core);
      await settle(
        session.send({
          text: 'Make it red',
          chips: [{ id: 'c1', label: 'Login form', detail: 'Submit', objectId: 'obj-1', selector: 'button.submit' }],
          images: [{ mediaType: 'image/png', data: 'AAAA' }],
        }),
      );
      expect(session.messages[0].parts).toEqual([
        { type: 'text', text: 'Make it red' },
        { type: 'text', text: 'The prompt refers to:\n- Login form › Submit (objectId: obj-1, element: button.submit)' },
        { type: 'image', mediaType: 'image/png', data: 'AAAA' },
      ]);
    });

    it('detaches its actor and ends a running prompt when unbound', async () => {
      const session = new KritzelChatSession({ transport: createScriptedTransport(['slow'], { delayMs: 30 }) });
      session._attach(core);
      expect(core.agenticActionManager.getActor((session as any)._userActor.id)).toMatchObject({ kind: 'user' });
      const running = session.send('hi');
      session._detach();
      await expect(running).resolves.toEqual({ status: 'detached' });
      expect(session.isAttached).toBe(false);
    });

    it('detaches only once idle with _detachWhenIdle', async () => {
      const session = new KritzelChatSession({ transport: createScriptedTransport(['slow'], { delayMs: 20 }) });
      session._attach(core);
      const running = session.send('hi');
      session._detachWhenIdle();
      expect(session.isAttached).toBe(true);
      await expect(running).resolves.toEqual({ status: 'completed' });
      expect(session.isAttached).toBe(false);
    });

    it('ends with detached when the workspace is destroyed while it runs', async () => {
      const session = new KritzelChatSession({ transport: createScriptedTransport(['slow'], { delayMs: 30 }) });
      session._attach(core);
      const running = session.send('hi');
      await flushMicrotasks();
      map.destroy();
      await expect(running).resolves.toEqual({ status: 'detached' });
    });
  });

  describe('tool calls', () => {
    it('answers every tool call: unknown tools, throwing tools and the rest after a stop', async () => {
      const session = new KritzelChatSession({
        tools: [
          {
            name: 'explode',
            description: 'Throws.',
            inputSchema: { type: 'object', properties: {} },
            run: async () => {
              throw new Error('boom');
            },
          },
          {
            name: 'halt',
            description: 'Stops the session.',
            inputSchema: { type: 'object', properties: {} },
            run: async () => {
              session.stop();
              return '{"completed":true}';
            },
          },
        ],
        transport: createScriptedTransport([{ toolCalls: [{ tool: 'nope' }, { tool: 'explode' }, { tool: 'halt' }, shapeCall(0)] }, 'unreachable']),
      });
      session._attach(core);
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(settle(session.send('go'))).resolves.toEqual({ status: 'stopped' });

      const results = resultsOf(session.messages[2]);
      expect(results.map(result => [result.name, !!result.isError])).toEqual([
        ['nope', true],
        ['explode', true],
        ['halt', false],
        ['create_shape', true],
      ]);
      expect(JSON.parse(results[1].output)).toMatchObject({ completed: false, message: 'boom' });
      expect(session.messages).toHaveLength(3);
      expect(map.allObjects()).toHaveLength(0);
    });

    it('stops at the step limit with every call answered', async () => {
      const session = new KritzelChatSession({ maxSteps: 2, transport: createScriptedTransport([{ toolCalls: [{ tool: 'observe_canvas' }] }]) });
      session._attach(core);
      await expect(settle(session.send('loop'))).resolves.toEqual({ status: 'step-limit' });
      expect(session.messages.map(message => message.role)).toEqual(['user', 'assistant', 'tool', 'assistant', 'tool']);
    });

    it('rejects app tools that clash with canvas tools', async () => {
      const session = new KritzelChatSession({
        tools: [{ name: 'create_shape', description: '', inputSchema: { type: 'object', properties: {} }, run: async () => '' }],
        transport: createScriptedTransport(['x']),
      });
      session._attach(core);
      const result = await settle(session.send('x'));
      expect(result.status).toBe('error');
    });

    it('closes open tool calls of a restored conversation', () => {
      const session = new KritzelChatSession({
        transport: createScriptedTransport(['x']),
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'go' }] },
          {
            role: 'assistant',
            parts: [
              { type: 'tool-call', id: 'a', name: 'observe_canvas', input: {} },
              { type: 'tool-call', id: 'b', name: 'observe_canvas', input: {} },
            ],
          },
          { role: 'tool', parts: [{ type: 'tool-result', toolCallId: 'a', name: 'observe_canvas', output: '{}' }] },
          { role: 'assistant', parts: [{ type: 'tool-call', id: 'c', name: 'observe_canvas', input: {} }] },
        ],
      });
      expect(session.messages.map(message => message.role)).toEqual(['user', 'assistant', 'tool', 'assistant', 'tool']);
      expect(resultsOf(session.messages[2]).map(result => [result.toolCallId, !!result.isError])).toEqual([
        ['a', false],
        ['b', true],
      ]);
      expect(resultsOf(session.messages[4]).map(result => result.toolCallId)).toEqual(['c']);
    });
  });

  describe('transport', () => {
    it('buffers streamed answers', async () => {
      async function* stream(): AsyncIterable<KritzelChatStreamEvent> {
        yield { type: 'text-delta', text: 'Hel' };
        yield { type: 'text-delta', text: 'lo' };
        yield { type: 'finish', stopReason: 'end', providerData: { id: 'msg-1' } };
      }
      const session = new KritzelChatSession({ transport: () => stream() });
      session._attach(core);
      await expect(settle(session.send('hi'))).resolves.toEqual({ status: 'completed' });
      expect(session.messages[1]).toEqual({ role: 'assistant', parts: [{ type: 'text', text: 'Hello' }], providerData: { id: 'msg-1' } });
    });

    it('accepts a promise of a stream and tool-call parts from it', async () => {
      let calls = 0;
      const session = new KritzelChatSession({
        transport: async () => {
          calls++;
          async function* stream(): AsyncIterable<KritzelChatStreamEvent> {
            if (calls === 1) {
              yield { type: 'part', part: { type: 'tool-call', id: '', name: 'observe_canvas', input: '{}' } };
            } else {
              yield { type: 'message', message: { role: 'assistant', parts: [{ type: 'text', text: 'seen' }] } };
            }
          }
          return stream();
        },
      });
      session._attach(core);
      await expect(settle(session.send('look'))).resolves.toEqual({ status: 'completed' });
      const call = session.messages[1].parts[0] as any;
      expect(call.id).toMatch(/^call-/);
      expect(resultsOf(session.messages[2])[0].toolCallId).toBe(call.id);
    });

    it('reports transport errors and stops pending requests', async () => {
      const failing = new KritzelChatSession({ transport: async () => Promise.reject(new Error('offline')) });
      failing._attach(core);
      const result = await settle(failing.send('hi'));
      expect(result.status).toBe('error');
      expect((result.error as Error).message).toBe('offline');
      failing._detach();

      let seenSignal: AbortSignal | null = null;
      const waiting = new KritzelChatSession({
        transport: (_request, { signal }) => {
          seenSignal = signal;
          return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
        },
      });
      waiting._attach(core);
      const running = waiting.send('hi');
      await flushMicrotasks();
      waiting.stop();
      await expect(running).resolves.toEqual({ status: 'stopped' });
      expect(seenSignal!.aborted).toBe(true);
      expect(waiting.messages.map(message => message.role)).toEqual(['user']);
    });
  });

  describe('with an agent', () => {
    it('acts as the agent, shows the thinking status and keeps agent history', async () => {
      const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
      const statuses: (string | null)[] = [];
      const script = createScriptedTransport([{ toolCalls: [shapeCall(0)] }, 'Done.']);
      const session = new KritzelChatSession({
        agent,
        instant: true,
        transport: (request, options) => {
          statuses.push(agent.state.status);
          return script(request, options);
        },
      });
      const second = new KritzelChatSession({ agent, transport: createScriptedTransport(['x']) });
      session._attach(core);
      second._attach(core);
      expect(session.mode).toBe('agent');
      expect(session.tools.map(tool => tool.name)).toContain('undo');

      const userSteps = map.undoManager!.undoStack.length;
      const running = session.send('Draw');
      await expect(second.send('also')).resolves.toEqual({ status: 'busy' });
      await expect(settle(running)).resolves.toEqual({ status: 'completed' });

      expect(statuses[0]).toBe('Thinking…');
      expect(agent.state.status).toBeNull();
      expect(map.undoManager!.undoStack.length).toBe(userSteps);
      expect(map.getAgentUndoStackLength('claude')).toBe(1);
      expect(JSON.parse(resultsOf(session.messages[2])[0].output)).toMatchObject({ completed: true, objects: [{ createdBy: 'claude' }] });
    });

    it('ends with detached when the agent is removed', async () => {
      const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
      const session = new KritzelChatSession({ agent, transport: createScriptedTransport(['slow'], { delayMs: 30 }) });
      session._attach(core);
      const running = session.send('hi');
      await flushMicrotasks();
      core.agentManager.remove(agent);
      await expect(running).resolves.toEqual({ status: 'detached' });
      await expect(session.send('again')).resolves.toEqual({ status: 'detached' });
    });
  });
});
