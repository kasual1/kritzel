import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelAgenticCursorManager } from '../managers/agentic-cursor.manager';
import { KritzelAgenticActionManager } from '../managers/agentic-action.manager';
import { KritzelAgentManager } from '../managers/agent.manager';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelClipboardManager } from '../managers/clipboard.manager';
import { KritzelAgent } from '../agent/agent.class';
import { KritzelChatSession, isKritzelChatSession } from './chat-session.class';
import { createScriptedTransport } from './scripted-transport';
import { KritzelCore } from '../core/core.class';
import { KritzelShape } from '../objects/shape.class';
import { formatAgentToolResult } from '../agent/agent-tools';
import type {
  KritzelChatMessage,
  KritzelChatTool,
  KritzelChatRequest,
  KritzelChatSessionOptions,
  KritzelChatStreamEvent,
  KritzelChatToolCallUpdate,
  KritzelChatToolResultPart,
} from '../../interfaces/chat-session.interface';

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
    // The real insert preparation, as the addObject action uses it.
    fakeCore._store = fakeCore.store;
    fakeCore.prepareObjectForInsert = KritzelCore.prototype.prepareObjectForInsert;
    fakeCore.insertPreparedObject = KritzelCore.prototype.insertPreparedObject;
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

  /** An app tool that places a pre-built shape through the session's actor and records what it got. */
  const placeBoxTool = (seen: { kind?: string; signal?: AbortSignal }): KritzelChatTool => ({
    name: 'place_box',
    description: 'Places a box built by the app.',
    inputSchema: { type: 'object', properties: {} },
    run: async (_input, { actor, signal }) => {
      seen.kind = actor.kind;
      seen.signal = signal;
      const box = new KritzelShape({ translateX: 400, translateY: 0, width: 100, height: 50 });
      return formatAgentToolResult(await actor.perform({ type: 'addObject', object: box }));
    },
  });

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

    it('names the clash: with a canvas tool, or an app tool defined twice', () => {
      const appTool = (name: string) => ({ name, description: '', inputSchema: { type: 'object' as const, properties: {} }, run: async () => '' });
      const clash = new KritzelChatSession({ tools: [appTool('create_shape')], transport: createScriptedTransport(['x']) });
      expect(() => clash.tools).toThrow('The chat tool "create_shape" clashes with a canvas tool.');
      const twice = new KritzelChatSession({ tools: [appTool('lookup'), appTool('lookup')], transport: createScriptedTransport(['x']) });
      expect(() => twice.tools).toThrow('The chat tool "lookup" is defined twice.');
      // A canvas tool that is off (create_iframe by default) leaves its name free.
      expect(() => new KritzelChatSession({ tools: [appTool('create_iframe')], transport: createScriptedTransport(['x']) }).tools).not.toThrow();
    });

    it('lets app tools act as the user: their objects undo with the rest of the prompt', async () => {
      const seen: { kind?: string; signal?: AbortSignal } = {};
      const session = new KritzelChatSession({
        tools: [placeBoxTool(seen)],
        transport: createScriptedTransport([{ toolCalls: [shapeCall(0), { tool: 'place_box' }] }, 'Done.']),
      });
      session._attach(core);
      const userSteps = map.undoManager!.undoStack.length;

      await expect(settle(session.send('Two boxes'))).resolves.toEqual({ status: 'completed' });

      expect(seen.kind).toBe('user');
      expect(seen.signal).toBeInstanceOf(AbortSignal);
      const results = resultsOf(session.messages[2]);
      expect(results.map(result => [result.name, !!result.isError])).toEqual([
        ['create_shape', false],
        ['place_box', false],
      ]);
      const { completed, objectIds } = JSON.parse(results[1].output);
      expect(completed).toBe(true);
      expect(map.findById(objectIds[0])).toMatchObject({ userId: 'human' });
      expect(map.allObjects()).toHaveLength(2);
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 1);

      map.undo();
      expect(map.allObjects()).toHaveLength(0);
    });

    it('offers the optional canvas tools chosen with canvasTools, as the user and as an agent', () => {
      const names = (session: KritzelChatSession) => session.tools.map(tool => tool.name);
      const plain = new KritzelChatSession({ transport: createScriptedTransport(['x']) });
      expect(names(plain)).toContain('create_image');
      expect(names(plain)).not.toContain('create_iframe');

      const user = new KritzelChatSession({ transport: createScriptedTransport(['x']), canvasTools: { images: false, iframes: true } });
      user._attach(core);
      expect(names(user)).toContain('create_iframe');
      expect(names(user)).not.toContain('create_image');

      const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
      const agentSession = new KritzelChatSession({ agent, transport: createScriptedTransport(['x']), canvasTools: { iframes: true } });
      expect(names(agentSession)).toEqual(expect.arrayContaining(['create_image', 'create_iframe']));
    });

    it('fails app tools that act while the session is not bound to an editor', async () => {
      const session = new KritzelChatSession({ tools: [placeBoxTool({})], transport: createScriptedTransport(['x']) });
      const tool = session.tools.find(candidate => candidate.name === 'place_box')!;
      await expect(tool.run({})).rejects.toThrow('not bound to an editor');
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

  describe('streamed tool calls', () => {
    const STOPPED = { completed: false, reason: 'aborted', hint: 'The user stopped the response. Do not retry unless asked.' };
    const INTERRUPTED = { completed: false, reason: 'aborted', hint: 'The tool call was interrupted and did not run.' };

    const gate = () => {
      let open!: () => void;
      const promise = new Promise<void>(resolve => (open = resolve));
      return { promise, open };
    };

    /** Rejects once the signal aborts, like a request the user stopped. */
    const abortion = (signal: AbortSignal) =>
      new Promise<never>((_resolve, reject) => {
        if (signal.aborted) {
          reject(new Error('aborted'));
        }
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });

    /** A tool call as a model streams it: start, its input's JSON in pieces, then the complete part. */
    function* callEvents(id: string, name: string, input: Record<string, unknown>, chunk = 10): Generator<KritzelChatStreamEvent> {
      yield { type: 'tool-call-start', id, name };
      const json = JSON.stringify(input);
      for (let i = 0; i < json.length; i += chunk) {
        yield { type: 'tool-call-delta', id, inputDelta: json.slice(i, i + chunk) };
      }
      yield { type: 'part', part: { type: 'tool-call', id, name, input } };
    }

    async function* textStream(text: string): AsyncGenerator<KritzelChatStreamEvent> {
      yield { type: 'text-delta', text };
      yield { type: 'finish', stopReason: 'end' };
    }

    /** A transport answering each model step with the next stream, then with "Done.". */
    const streams =
      (...answers: ((signal: AbortSignal) => AsyncIterable<KritzelChatStreamEvent>)[]): KritzelChatSessionOptions['transport'] =>
      (_request, { signal }) => {
        const answer = answers.shift();
        return answer ? answer(signal) : textStream('Done.');
      };

    const record = (session: KritzelChatSession) => {
      const updates: KritzelChatToolCallUpdate[] = [];
      session.on('tool-call', update => updates.push(update));
      return updates;
    };
    const statesOf = (updates: KritzelChatToolCallUpdate[], id: string) => updates.filter(update => update.id === id).map(update => update.state);
    const lastOf = (updates: KritzelChatToolCallUpdate[], id: string) => updates.filter(update => update.id === id).pop()!;

    /** Each reported call ends exactly once, and nothing is reported after its end. */
    const expectEachEndsOnce = (updates: KritzelChatToolCallUpdate[]) => {
      for (const id of new Set(updates.map(update => update.id))) {
        const states = statesOf(updates, id);
        const ends = states.filter(state => state === 'done' || state === 'discarded');
        expect({ id, ends: ends.length, last: states[states.length - 1] }).toEqual({ id, ends: 1, last: ends[0] });
      }
    };

    const until = async (condition: () => boolean, maxFrames = 600) => {
      for (let i = 0; i < maxFrames && !condition(); i++) {
        await step();
      }
      expect(condition()).toBe(true);
    };

    const roles = (session: KritzelChatSession) => session.messages.map(message => message.role);
    const shape = (x: number) => ({ x, y: 0, width: 100, height: 50 });

    /** An app tool that runs until `release` resolves or the prompt is stopped. */
    const holdTool = (release: Promise<void>, log: string[]): KritzelChatTool => ({
      name: 'hold',
      description: 'Waits.',
      inputSchema: { type: 'object', properties: {} },
      run: async (_input, { signal }) => {
        log.push('hold:start');
        await Promise.race([release, new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true }))]);
        log.push('hold:end');
        return JSON.stringify({ completed: !signal.aborted });
      },
    });

    it('runs a call as soon as its part arrives, while the answer still streams', async () => {
      const rest = gate();
      const session = new KritzelChatSession({
        transport: streams(async function* () {
          yield { type: 'text-delta', text: 'Drawing.' };
          yield* callEvents('c1', 'create_shape', shape(0));
          await rest.promise;
          yield { type: 'text-delta', text: ' Done.' };
          yield { type: 'finish', stopReason: 'tool-calls' };
        }),
      });
      session._attach(core);
      const updates = record(session);
      const log: string[] = [];
      session.on('tool-call', update => update.state !== 'input' && log.push(`${update.state}:${update.id}`));
      session.on('message', message => log.push(`message:${message.role}`));
      const userSteps = map.undoManager!.undoStack.length;

      const running = session.send('Draw');
      await until(() => lastOf(updates, 'c1')?.state === 'done');

      expect(map.allObjects()).toHaveLength(1);
      expect(roles(session)).toEqual(['user']);
      const pieces = Math.ceil(JSON.stringify(shape(0)).length / 10);
      expect(statesOf(updates, 'c1')).toEqual(['started', ...Array(pieces).fill('input'), 'ready', 'running', 'done']);
      expect(updates.filter(update => update.state === 'input').map(update => update.inputDelta).join('')).toBe(JSON.stringify(shape(0)));
      expect(lastOf(updates, 'c1')).toMatchObject({ ran: true, input: shape(0), result: { toolCallId: 'c1', name: 'create_shape' } });

      rest.open();
      await expect(settle(running)).resolves.toEqual({ status: 'completed' });
      expect(roles(session)).toEqual(['user', 'assistant', 'tool', 'assistant']);
      expect(session.messages[1].parts).toEqual([
        { type: 'text', text: 'Drawing.' },
        { type: 'tool-call', id: 'c1', name: 'create_shape', input: shape(0) },
        { type: 'text', text: ' Done.' },
      ]);
      expect(JSON.parse(resultsOf(session.messages[2])[0].output)).toMatchObject({ completed: true });
      expect(log.slice(0, 6)).toEqual(['message:user', 'started:c1', 'ready:c1', 'running:c1', 'done:c1', 'message:assistant']);
      expectEachEndsOnce(updates);
      // The whole prompt is still one step of the user history.
      expect(map.undoManager!.undoStack.length).toBe(userSteps + 1);
      map.undo();
      expect(map.allObjects()).toHaveLength(0);
    });

    it('runs the calls one at a time in the order their parts arrive', async () => {
      const release = gate();
      const log: string[] = [];
      const session = new KritzelChatSession({
        tools: [holdTool(release.promise, log)],
        transport: streams(async function* () {
          yield { type: 'part', part: { type: 'tool-call', id: 'a', name: 'hold', input: {} } };
          yield* callEvents('b', 'create_shape', shape(0));
          yield { type: 'finish', stopReason: 'tool-calls' };
        }),
      });
      session._attach(core);
      const updates = record(session);

      const running = session.send('go');
      await until(() => log.length === 1 && roles(session).length === 2);
      await flushMicrotasks();
      expect(log).toEqual(['hold:start']);
      expect(statesOf(updates, 'b')).not.toContain('running');

      release.open();
      await expect(settle(running)).resolves.toEqual({ status: 'completed' });
      expect(log).toEqual(['hold:start', 'hold:end']);
      expect(resultsOf(session.messages[2]).map(result => result.toolCallId)).toEqual(['a', 'b']);
      expect(map.allObjects()).toHaveLength(1);
      expectEachEndsOnce(updates);
    });

    it('runs the calls once the answer has ended with eagerToolCalls: false', async () => {
      const rest = gate();
      const session = new KritzelChatSession({
        eagerToolCalls: false,
        transport: streams(async function* () {
          yield* callEvents('c1', 'create_shape', shape(0));
          await rest.promise;
          yield { type: 'finish', stopReason: 'tool-calls' };
        }),
      });
      session._attach(core);
      const updates = record(session);

      const running = session.send('Draw');
      await until(() => lastOf(updates, 'c1')?.state === 'ready');
      for (let i = 0; i < 10; i++) {
        await step();
      }
      expect(map.allObjects()).toHaveLength(0);

      rest.open();
      await expect(settle(running)).resolves.toEqual({ status: 'completed' });
      expect(map.allObjects()).toHaveLength(1);
      expect(roles(session)).toEqual(['user', 'assistant', 'tool', 'assistant']);
      expect(statesOf(updates, 'c1').filter(state => state !== 'input')).toEqual(['started', 'ready', 'running', 'done']);
    });

    it('keeps the answer read so far when stopped after a call ran', async () => {
      const session = new KritzelChatSession({
        transport: streams(async function* (signal) {
          yield { type: 'text-delta', text: 'Two boxes.' };
          yield* callEvents('c1', 'create_shape', shape(0));
          yield { type: 'tool-call-start', id: 'c2', name: 'create_shape' };
          yield { type: 'tool-call-delta', id: 'c2', inputDelta: '{"x":' };
          await abortion(signal);
        }),
      });
      session._attach(core);
      const updates = record(session);

      const running = session.send('Draw');
      await until(() => lastOf(updates, 'c1')?.state === 'done' && lastOf(updates, 'c2')?.state === 'input');
      session.stop();

      await expect(settle(running)).resolves.toEqual({ status: 'stopped' });
      expect(roles(session)).toEqual(['user', 'assistant', 'tool']);
      expect(session.messages[1].parts).toEqual([
        { type: 'text', text: 'Two boxes.' },
        { type: 'tool-call', id: 'c1', name: 'create_shape', input: shape(0) },
      ]);
      expect(JSON.parse(resultsOf(session.messages[2])[0].output)).toMatchObject({ completed: true });
      expect(map.allObjects()).toHaveLength(1);
      expect(lastOf(updates, 'c2').state).toBe('discarded');
      expectEachEndsOnce(updates);
    });

    it('stops the running call and gives the queued ones a stopped result', async () => {
      const log: string[] = [];
      const session = new KritzelChatSession({
        tools: [holdTool(new Promise(() => undefined), log)],
        transport: streams(async function* (signal) {
          yield { type: 'part', part: { type: 'tool-call', id: 'a', name: 'hold', input: {} } };
          yield* callEvents('b', 'create_shape', shape(0));
          yield { type: 'tool-call-start', id: 'c', name: 'create_shape' };
          await abortion(signal);
        }),
      });
      session._attach(core);
      const updates = record(session);

      const running = session.send('go');
      await until(() => log.length === 1 && lastOf(updates, 'c')?.state === 'started');
      session.stop();

      await expect(settle(running)).resolves.toEqual({ status: 'stopped' });
      expect(log).toEqual(['hold:start', 'hold:end']);
      expect(roles(session)).toEqual(['user', 'assistant', 'tool']);
      expect(session.messages[1].parts.map(part => (part as any).id)).toEqual(['a', 'b']);
      const results = resultsOf(session.messages[2]);
      expect(results.map(result => result.toolCallId)).toEqual(['a', 'b']);
      expect(JSON.parse(results[0].output)).toEqual({ completed: false });
      expect(JSON.parse(results[1].output)).toEqual(STOPPED);
      expect(map.allObjects()).toHaveLength(0);
      expect(lastOf(updates, 'a')).toMatchObject({ state: 'done', ran: true });
      expect(lastOf(updates, 'b')).toMatchObject({ state: 'done', ran: false });
      expect(statesOf(updates, 'b')).not.toContain('running');
      expect(statesOf(updates, 'c')).toEqual(['started', 'discarded']);
      expectEachEndsOnce(updates);
    });

    it('drops the answer when it ends before any call ran', async () => {
      const stopped = new KritzelChatSession({
        transport: streams(async function* (signal) {
          yield { type: 'text-delta', text: 'Thinking about it' };
          yield { type: 'tool-call-start', id: 'c1', name: 'create_shape' };
          yield { type: 'tool-call-delta', id: 'c1', inputDelta: '{"x":0' };
          await abortion(signal);
        }),
      });
      stopped._attach(core);
      const stoppedUpdates = record(stopped);
      const running = stopped.send('Draw');
      await until(() => lastOf(stoppedUpdates, 'c1')?.state === 'input');
      stopped.stop();
      await expect(settle(running)).resolves.toEqual({ status: 'stopped' });
      expect(roles(stopped)).toEqual(['user']);
      expect(statesOf(stoppedUpdates, 'c1')).toEqual(['started', 'input', 'discarded']);
      stopped._detach();

      const failing = new KritzelChatSession({
        eagerToolCalls: false,
        transport: streams(async function* () {
          yield* callEvents('c1', 'create_shape', shape(0));
          throw new Error('lost');
        }),
      });
      failing._attach(core);
      const failingUpdates = record(failing);
      const result = await settle(failing.send('Draw'));
      expect(result.status).toBe('error');
      expect((result.error as Error).message).toBe('lost');
      expect(roles(failing)).toEqual(['user']);
      expect(lastOf(failingUpdates, 'c1').state).toBe('discarded');
      expect(map.allObjects()).toHaveLength(0);
    });

    it('lets the running call finish and interrupts the queued ones when the stream fails', async () => {
      const release = gate();
      const log: string[] = [];
      const session = new KritzelChatSession({
        tools: [holdTool(release.promise, log)],
        transport: streams(async function* () {
          yield { type: 'part', part: { type: 'tool-call', id: 'a', name: 'hold', input: {} } };
          yield { type: 'part', part: { type: 'tool-call', id: 'b', name: 'create_shape', input: shape(0) } };
          yield { type: 'text-delta', text: 'And' };
          throw new Error('lost');
        }),
      });
      session._attach(core);
      const updates = record(session);

      const running = session.send('go');
      await until(() => log.length === 1);
      await flushMicrotasks();
      release.open();

      const result = await settle(running);
      expect(result.status).toBe('error');
      expect((result.error as Error).message).toBe('lost');
      expect(log).toEqual(['hold:start', 'hold:end']);
      expect(roles(session)).toEqual(['user', 'assistant', 'tool']);
      expect(session.messages[1].parts.map(part => part.type)).toEqual(['tool-call', 'tool-call', 'text']);
      const results = resultsOf(session.messages[2]);
      expect(JSON.parse(results[0].output)).toEqual({ completed: true });
      expect(JSON.parse(results[1].output)).toEqual(INTERRUPTED);
      expect(map.allObjects()).toHaveLength(0);
      expectEachEndsOnce(updates);
    });

    it('applies message events: drops queued calls it leaves out, keeps calls that ran and runs the ones it adds', async () => {
      const release = gate();
      const streamed = gate();
      const log: string[] = [];
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const session = new KritzelChatSession({
        tools: [holdTool(release.promise, log)],
        transport: streams(async function* () {
          yield { type: 'part', part: { type: 'tool-call', id: 'a', name: 'hold', input: {} } };
          yield { type: 'part', part: { type: 'tool-call', id: 'b', name: 'create_shape', input: shape(0) } };
          // "a" runs (and holds) before the message arrives; "b" waits for its turn.
          for (let i = 0; i < 100 && !log.includes('hold:start'); i++) {
            await Promise.resolve();
          }
          yield {
            type: 'message',
            message: {
              role: 'assistant',
              parts: [
                { type: 'text', text: 'Replaced.' },
                { type: 'tool-call', id: 'd', name: 'create_shape', input: shape(300) },
              ],
              providerData: { id: 'msg-2' },
            },
          };
          streamed.open();
          yield { type: 'finish', stopReason: 'tool-calls' };
        }),
      });
      session._attach(core);
      const updates = record(session);

      const running = session.send('go');
      await streamed.promise;
      release.open();
      await expect(settle(running)).resolves.toEqual({ status: 'completed' });

      expect(session.messages[1]).toEqual({
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Replaced.' },
          { type: 'tool-call', id: 'd', name: 'create_shape', input: shape(300) },
          { type: 'tool-call', id: 'a', name: 'hold', input: {} },
        ],
        providerData: { id: 'msg-2' },
      });
      expect(resultsOf(session.messages[2]).map(result => result.toolCallId)).toEqual(['d', 'a']);
      expect(map.allObjects().map(object => object.translateX)).toEqual([300]);
      expect(statesOf(updates, 'b')).toEqual(['started', 'ready', 'discarded']);
      expect(statesOf(updates, 'd')).toEqual(['started', 'ready', 'running', 'done']);
      expect(lastOf(updates, 'a')).toMatchObject({ state: 'done', ran: true });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('"a" (hold), which already ran');
      expectEachEndsOnce(updates);
    });

    it('never runs a call twice when a message event repeats it', async () => {
      const ran = gate();
      const inputs: unknown[] = [];
      const session = new KritzelChatSession({
        tools: [
          {
            name: 'count',
            description: 'Counts.',
            inputSchema: { type: 'object', properties: {} },
            run: async input => {
              inputs.push(input);
              ran.open();
              return '{"completed":true}';
            },
          },
        ],
        transport: streams(async function* () {
          yield { type: 'part', part: { type: 'tool-call', id: 'c1', name: 'count', input: { n: 1 } } };
          await ran.promise;
          yield {
            type: 'message',
            message: { role: 'assistant', parts: [{ type: 'tool-call', id: 'c1', name: 'count', input: { n: 2 } }, { type: 'text', text: 'Counted.' }] },
          };
          yield { type: 'finish' };
        }),
      });
      session._attach(core);
      await expect(settle(session.send('count'))).resolves.toEqual({ status: 'completed' });
      expect(inputs).toEqual([{ n: 1 }]);
      expect(session.messages[1].parts).toEqual([
        { type: 'tool-call', id: 'c1', name: 'count', input: { n: 1 } },
        { type: 'text', text: 'Counted.' },
      ]);
      expect(resultsOf(session.messages[2])).toHaveLength(1);
    });

    it('ignores events it cannot place and drops calls left open', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const session = new KritzelChatSession({
        transport: streams(async function* () {
          yield { type: 'tool-call-start' } as any;
          yield { type: 'tool-call-start', id: '', name: 'observe_canvas' };
          yield { type: 'tool-call-start', id: 'nameless' } as any;
          yield { type: 'tool-call-delta', id: 'unknown', inputDelta: '{}' };
          yield { type: 'tool-call-start', id: 'x', name: 'observe_canvas' };
          yield { type: 'tool-call-start', id: 'x', name: 'create_shape' };
          yield { type: 'tool-call-delta', id: 'x', inputDelta: '' };
          yield { type: 'reasoning-delta', text: 'hm' } as any;
          yield null as any;
          yield { type: 'tool-call-start', id: 'open', name: 'create_shape' };
          yield { type: 'part', part: { type: 'tool-call', id: 'x', name: 'observe_canvas', input: {} } };
          yield { type: 'tool-call-delta', id: 'x', inputDelta: '{"late":1}' };
          yield { type: 'finish', stopReason: 'tool-calls' };
        }),
      });
      session._attach(core);
      const updates = record(session);

      await expect(settle(session.send('look'))).resolves.toEqual({ status: 'completed' });
      expect([...new Set(updates.map(update => update.id))]).toEqual(['x', 'open']);
      expect(statesOf(updates, 'x')).toEqual(['started', 'ready', 'running', 'done']);
      expect(lastOf(updates, 'x')).toMatchObject({ name: 'observe_canvas', inputText: '' });
      expect(statesOf(updates, 'open')).toEqual(['started', 'discarded']);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('"open" (create_shape)');
      expect(session.messages[1].parts.map(part => (part as any).id)).toEqual(['x']);
      expectEachEndsOnce(updates);
    });

    it('reports nothing for answers that are not streamed', async () => {
      const session = new KritzelChatSession({ transport: createScriptedTransport([{ toolCalls: [shapeCall(0)] }, 'Done.']) });
      session._attach(core);
      const updates = record(session);
      await expect(settle(session.send('Draw'))).resolves.toEqual({ status: 'completed' });
      expect(updates).toEqual([]);
      expect(map.allObjects()).toHaveLength(1);
    });

    it('passes the tool call ID to tools', async () => {
      const ids: (string | undefined)[] = [];
      const idTool: KritzelChatTool = {
        name: 'which',
        description: 'Records its call ID.',
        inputSchema: { type: 'object', properties: {} },
        run: async (_input, context) => {
          ids.push(context.toolCallId);
          return '{"completed":true}';
        },
      };
      for (const stream of [false, true]) {
        const session = new KritzelChatSession({ tools: [idTool], transport: createScriptedTransport([{ toolCalls: [{ tool: 'which' }] }, 'ok'], { stream }) });
        session._attach(core);
        await expect(settle(session.send('which'))).resolves.toEqual({ status: 'completed' });
        session._detach();
      }
      expect(ids).toEqual(['scripted-1', 'scripted-1']);
    });

    it('streams scripted answers into the same messages', async () => {
      const script = () => [{ text: 'Drawing two boxes.', toolCalls: [shapeCall(0, 'A'), shapeCall(300, 'B')], parts: [{ type: 'text' as const, text: 'More.' }] }, 'Done.'];
      const shapeOf = (session: KritzelChatSession) =>
        session.messages.map(message => (message.role === 'tool' ? resultsOf(message).map(result => [result.toolCallId, !!result.isError]) : message.parts));

      const plain = new KritzelChatSession({ transport: createScriptedTransport(script()) });
      plain._attach(core);
      await expect(settle(plain.send('Draw'))).resolves.toEqual({ status: 'completed' });
      plain._detach();

      const events: string[] = [];
      const transport = createScriptedTransport(script(), { stream: { chunkSize: 8 } });
      const streamed = new KritzelChatSession({
        transport: async (request, options) => {
          const answer = (await transport(request, options)) as AsyncIterable<KritzelChatStreamEvent>;
          return (async function* () {
            for await (const event of answer) {
              events.push(event.type);
              yield event;
            }
          })();
        },
      });
      streamed._attach(core);
      const updates = record(streamed);
      await expect(settle(streamed.send('Draw'))).resolves.toEqual({ status: 'completed' });

      expect(shapeOf(streamed)).toEqual(shapeOf(plain));
      expect(events.slice(0, 4)).toEqual(['text-delta', 'text-delta', 'text-delta', 'tool-call-start']);
      expect(events.filter(type => type === 'part')).toHaveLength(3);
      // The extra part follows the calls; then the answer finishes.
      expect(events.slice(events.indexOf('finish') - 1, events.indexOf('finish') + 1)).toEqual(['part', 'finish']);
      expect(lastOf(updates, 'scripted-1').inputText).toBe(JSON.stringify(shapeCall(0, 'A').input));
      expect(map.allObjects()).toHaveLength(4);
      expectEachEndsOnce(updates);
    });

    it('stops scripted streams between chunks', async () => {
      const session = new KritzelChatSession({
        transport: createScriptedTransport([{ text: 'A long answer that streams slowly.', toolCalls: [shapeCall(0)] }], { stream: { chunkSize: 4, chunkDelayMs: 20 } }),
      });
      session._attach(core);
      jest.useFakeTimers({ doNotFake: ['performance', 'queueMicrotask', 'nextTick'] });
      try {
        const running = session.send('Draw');
        await flushMicrotasks();
        jest.advanceTimersByTime(30);
        await flushMicrotasks();
        session.stop();
        await expect(running).resolves.toEqual({ status: 'stopped' });
      } finally {
        jest.useRealTimers();
      }
      expect(roles(session)).toEqual(['user']);
      expect(map.allObjects()).toHaveLength(0);
    });

    describe('edge cases', () => {
      it('drops a call when a listener stops the prompt as the call completes', async () => {
        const session = new KritzelChatSession({
          transport: streams(async function* (signal) {
            yield* callEvents('c1', 'create_shape', shape(0));
            await abortion(signal);
          }),
        });
        session._attach(core);
        const updates = record(session);
        session.on('tool-call', update => update.state === 'ready' && session.stop());

        await expect(settle(session.send('Draw'))).resolves.toEqual({ status: 'stopped' });
        expect(roles(session)).toEqual(['user']);
        expect(statesOf(updates, 'c1').filter(state => state !== 'input')).toEqual(['started', 'ready', 'discarded']);
        expect(map.allObjects()).toHaveLength(0);
      });

      it('keeps a call that is being answered when a message event leaves it out', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        // Already-resolved events, like a parser that holds a whole chunk: the next event arrives while the
        // unknown tool's call is being answered.
        const events: KritzelChatStreamEvent[] = [
          { type: 'part', part: { type: 'tool-call', id: 'u', name: 'nope', input: {} } },
          { type: 'message', message: { role: 'assistant', parts: [{ type: 'text', text: 'Never mind.' }] } },
          { type: 'finish' },
        ];
        const buffered: AsyncIterable<KritzelChatStreamEvent> = {
          [Symbol.asyncIterator]: () => {
            let index = 0;
            return { next: () => Promise.resolve(index < events.length ? { value: events[index++], done: false } : { value: undefined, done: true }) };
          },
        };
        const session = new KritzelChatSession({ transport: streams(() => buffered) });
        session._attach(core);
        const updates = record(session);

        await expect(settle(session.send('go'))).resolves.toEqual({ status: 'completed' });
        expect(statesOf(updates, 'u')).toEqual(['started', 'ready', 'done']);
        expect(session.messages[1].parts.map(part => part.type)).toEqual(['text', 'tool-call']);
        expect(JSON.parse(resultsOf(session.messages[2])[0].output)).toMatchObject({ reason: 'unknown-tool' });
        expect(warn).toHaveBeenCalledTimes(1);
      });

      it('ignores parts that are not objects, also while a call runs', async () => {
        const release = gate();
        const log: string[] = [];
        const session = new KritzelChatSession({
          tools: [holdTool(release.promise, log)],
          transport: streams(async function* () {
            yield { type: 'part', part: { type: 'tool-call', id: 'a', name: 'hold', input: {} } };
            yield { type: 'part', part: null } as any;
            yield { type: 'message', message: { role: 'assistant', parts: [null, { type: 'tool-call', id: 'a', name: 'hold', input: {} }] } } as any;
            yield { type: 'finish' };
          }),
        });
        session._attach(core);

        const running = session.send('go');
        await until(() => log.length === 1);
        await flushMicrotasks();
        expect(session.running).toBe(true);
        release.open();
        await expect(settle(running)).resolves.toEqual({ status: 'completed' });
        expect(log).toEqual(['hold:start', 'hold:end']);
        expect(session.messages[1].parts).toEqual([{ type: 'tool-call', id: 'a', name: 'hold', input: {} }]);
      });

      it('runs each call of a message event with its own input, also when IDs repeat', async () => {
        const inputs: unknown[] = [];
        const countTool: KritzelChatTool = {
          name: 'count',
          description: 'Counts.',
          inputSchema: { type: 'object', properties: {} },
          run: async input => {
            inputs.push(input);
            return '{"completed":true}';
          },
        };
        for (const eagerToolCalls of [false, true]) {
          inputs.length = 0;
          const session = new KritzelChatSession({
            eagerToolCalls,
            tools: [countTool],
            transport: streams(async function* () {
              yield {
                type: 'message',
                message: {
                  role: 'assistant',
                  parts: [
                    { type: 'tool-call', id: 'a', name: 'count', input: { n: 1 } },
                    { type: 'tool-call', id: 'a', name: 'count', input: { n: 2 } },
                  ],
                },
              };
              yield { type: 'finish' };
            }),
          });
          session._attach(core);
          await expect(settle(session.send('count'))).resolves.toEqual({ status: 'completed' });
          expect(inputs).toEqual([{ n: 1 }, { n: 2 }]);
          session._detach();
        }
      });

      it('lets a call still being written survive a message event that does not hold it yet', async () => {
        const session = new KritzelChatSession({
          transport: streams(async function* () {
            yield { type: 'tool-call-start', id: 'c1', name: 'create_shape' };
            yield { type: 'tool-call-delta', id: 'c1', inputDelta: '{"x":0,' };
            yield { type: 'message', message: { role: 'assistant', parts: [{ type: 'text', text: 'Drawing.' }] } };
            yield { type: 'tool-call-delta', id: 'c1', inputDelta: '"y":0,"width":100,"height":50}' };
            yield { type: 'part', part: { type: 'tool-call', id: 'c1', name: 'create_shape', input: shape(0) } };
            yield { type: 'finish' };
          }),
        });
        session._attach(core);
        const updates = record(session);

        await expect(settle(session.send('Draw'))).resolves.toEqual({ status: 'completed' });
        expect(statesOf(updates, 'c1')).toEqual(['started', 'input', 'input', 'ready', 'running', 'done']);
        expect(lastOf(updates, 'c1').inputText).toBe(JSON.stringify(shape(0)));
        expect(session.messages[1].parts.map(part => part.type)).toEqual(['text', 'tool-call']);
        expect(map.allObjects()).toHaveLength(1);
      });

      it('never reports an ID again once it ended', async () => {
        const session = new KritzelChatSession({
          transport: streams(async function* () {
            yield { type: 'part', part: { type: 'tool-call', id: 'x', name: 'observe_canvas', input: {} } };
            yield { type: 'message', message: { role: 'assistant', parts: [{ type: 'text', text: 'Let me look.' }] } };
            yield { type: 'tool-call-start', id: 'x', name: 'observe_canvas' };
            yield { type: 'finish' };
          }),
          eagerToolCalls: false,
        });
        session._attach(core);
        const updates = record(session);
        await expect(settle(session.send('look'))).resolves.toEqual({ status: 'completed' });
        expect(statesOf(updates, 'x')).toEqual(['started', 'ready', 'discarded']);
        expectEachEndsOnce(updates);
      });
    });

    describe('with an agent', () => {
      it('runs streamed calls as the agent while the model still writes', async () => {
        const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
        const rest = gate();
        const session = new KritzelChatSession({
          agent,
          instant: true,
          transport: streams(async function* () {
            yield* callEvents('c1', 'create_shape', shape(0));
            await rest.promise;
            yield { type: 'finish', stopReason: 'tool-calls' };
          }),
        });
        session._attach(core);
        const updates = record(session);
        const userSteps = map.undoManager!.undoStack.length;

        const running = session.send('Draw');
        await until(() => lastOf(updates, 'c1')?.state === 'done');
        expect(map.allObjects()).toHaveLength(1);
        expect(agent.state.status).toBe('Thinking…');

        rest.open();
        await expect(settle(running)).resolves.toEqual({ status: 'completed' });
        expect(agent.state.status).toBeNull();
        expect(map.undoManager!.undoStack.length).toBe(userSteps);
        expect(map.getAgentUndoStackLength('claude')).toBe(1);
        expect(JSON.parse(resultsOf(session.messages[2])[0].output)).toMatchObject({ completed: true, objects: [{ createdBy: 'claude' }] });
      });

      it('puts the status back when a streamed call runs a task past the end of the stream', async () => {
        const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
        const release = gate();
        const statuses: (string | null)[] = [];
        const session = new KritzelChatSession({
          agent,
          instant: true,
          tools: [
            {
              name: 'arrange',
              description: 'Runs a task.',
              inputSchema: { type: 'object', properties: {} },
              run: async () => {
                await agent.task('Arranging', () => release.promise);
                return '{"completed":true}';
              },
            },
          ],
          transport: streams(async function* () {
            yield { type: 'part', part: { type: 'tool-call', id: 'a', name: 'arrange', input: {} } };
            yield { type: 'finish' };
          }),
        });
        session._attach(core);
        const running = session.send('Arrange');
        await until(() => agent.state.status === 'Arranging');
        await flushMicrotasks();
        statuses.push(agent.state.status);
        release.open();
        await expect(settle(running)).resolves.toEqual({ status: 'completed' });
        statuses.push(agent.state.status);
        expect(statuses).toEqual(['Arranging', null]);
      });

      it('rolls back the action of a streamed call that is stopped while it animates', async () => {
        const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
        const session = new KritzelChatSession({
          agent,
          transport: streams(async function* (signal) {
            yield* callEvents('c1', 'create_shape', shape(800));
            await abortion(signal);
          }),
        });
        session._attach(core);
        const updates = record(session);

        const running = session.send('Draw');
        await until(() => lastOf(updates, 'c1')?.state === 'running');
        await step();
        await step();
        session.stop();

        await expect(settle(running)).resolves.toEqual({ status: 'stopped' });
        expect(map.allObjects()).toHaveLength(0);
        expect(roles(session)).toEqual(['user', 'assistant', 'tool']);
        expect(JSON.parse(resultsOf(session.messages[2])[0].output)).toMatchObject({ completed: false });
        expect(lastOf(updates, 'c1')).toMatchObject({ state: 'done', ran: true });
      });
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

    it('lets app tools act as the agent', async () => {
      const agent = core.agentManager.add(new KritzelAgent({ id: 'claude', name: 'Claude' }));
      const seen: { kind?: string } = {};
      const session = new KritzelChatSession({
        agent,
        instant: true,
        tools: [placeBoxTool(seen)],
        transport: createScriptedTransport([{ toolCalls: [{ tool: 'place_box' }] }, 'Done.']),
      });
      session._attach(core);
      const userSteps = map.undoManager!.undoStack.length;

      await expect(settle(session.send('A box'))).resolves.toEqual({ status: 'completed' });

      expect(seen.kind).toBe('agent');
      const { completed, objectIds } = JSON.parse(resultsOf(session.messages[2])[0].output);
      expect(completed).toBe(true);
      expect(map.findById(objectIds[0])).toMatchObject({ userId: 'claude' });
      expect(map.undoManager!.undoStack.length).toBe(userSteps);
      expect(map.getAgentUndoStackLength('claude')).toBe(1);
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
