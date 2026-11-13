import type {
  UpdrawAgenticAction,
  UpdrawAgenticActionFailureReason,
  UpdrawAgenticActionOptions,
  UpdrawAgenticActionResult,
  UpdrawAgenticFill,
} from '../../interfaces/agentic-action.interface';
import type {
  UpdrawAgentTool,
  UpdrawAgentToolCall,
  UpdrawAgentToolContext,
  UpdrawAgentToolResult,
  UpdrawAgentToolSchema,
  UpdrawAgentToolsOptions,
  UpdrawCanvasObject,
  UpdrawCanvasSnapshot,
  UpdrawObserveOptions,
} from '../../interfaces/agent.interface';
import { UpdrawAgentActionError } from './agent-action-error.class';
import { toCanvasElement, type UpdrawInspectElementsOptions } from './agent-elements';
import type { UpdrawJsonSchemaNode } from './agent-tool-schemas';
import type { UpdrawBaseObject } from '../objects/base-object.class';
import { parsePartialJson } from '../../helpers/partial-json.helper';
import type { UpdrawCore } from '../core/core.class';

/**
 * The machinery behind every canvas tool: one definition per tool (`UpdrawCanvasToolDefinition`) and one
 * binder (`bindCanvasTool`) that turns a definition into a provider-neutral `UpdrawAgentTool` for an actor.
 * All rules a tool needs live on its definition; everything every tool shares lives here.
 */

/**
 * Whoever the tools act for: an `UpdrawAgent` (kind `'agent'`, with a cursor) or an actor working as the local
 * user (kind `'user'`). @internal
 */
export interface UpdrawToolActor {
  readonly kind: 'agent' | 'user';
  readonly isAdded: boolean;
  perform(action: UpdrawAgenticAction, options?: UpdrawAgenticActionOptions): Promise<UpdrawAgenticActionResult>;
  observe(options?: UpdrawObserveOptions): Promise<UpdrawCanvasSnapshot>;
  _whenIdle(): Promise<void>;
  _describeObjects(objectIds: string[]): UpdrawCanvasObject[];
  /** The core the actor is added to, for tools that act on the editor itself (e.g. the viewport). */
  readonly _owner?: UpdrawCore | null;
  /** The elements inside an object's content, for `inspect_elements`. Never rejects. */
  _inspectElements(objectId: string, options: UpdrawInspectElementsOptions): Promise<UpdrawAgentToolResult>;
}

export type UpdrawToolActorKind = 'agent' | 'user';

/** Where a definition is bound: for which kind of actor, with which tool options. */
export interface UpdrawCanvasToolEnv {
  readonly kind: UpdrawToolActorKind;
  readonly options: Readonly<UpdrawAgentToolsOptions>;
}

/** A text that may read differently for an agent and for an actor working as the user. */
export type UpdrawCanvasToolText = string | { agent: string; user: string } | ((env: UpdrawCanvasToolEnv) => string);

/** What `prepare` gets: the environment, and a way to reject the input. */
export interface UpdrawCanvasToolInputContext extends UpdrawCanvasToolEnv {
  /** Rejects the input: the model gets `{ completed: false, reason: 'invalid-input', message }`. */
  invalid(message: string): never;
}

/** What `execute` gets. */
export interface UpdrawCanvasToolContext extends UpdrawCanvasToolInputContext {
  /** The tool runner's abort signal, if it gave one. */
  readonly signal: AbortSignal | null | undefined;
  readonly instant: boolean;
  /** Whether the actor is still on the canvas (read live). */
  readonly isAdded: boolean;
  /** The core the actor is added to (read live), or `null`. */
  readonly core: UpdrawCore | null;
  /**
   * Performs an action and answers like every canvas tool: the removed check, the signal and instant option,
   * refusals thrown inside `agent.task()`, snapshots of the changed objects (unless `describeObjects` is
   * `false`) and the reason hints.
   */
  perform(action: UpdrawAgenticAction, options?: { describeObjects?: boolean }): Promise<string>;
  observe(options: UpdrawObserveOptions): Promise<UpdrawCanvasSnapshot>;
  /** Lists the elements inside an object's content, as `inspect_elements` answers. */
  inspectElements(objectId: string, options: UpdrawInspectElementsOptions): Promise<UpdrawAgentToolResult>;
  /** Resolves when the actor's queued actions have finished. */
  whenIdle(): Promise<void>;
  /** The answer for a removed actor. */
  removedResult(): string;
  /** The answer for a refusal, with the hint for this kind of actor. */
  refusalResult(reason: UpdrawAgenticActionFailureReason, objectIds?: string[]): string;
  /** The answer for an error: input errors and an unavailable canvas become results, other errors are rethrown. */
  errorResult(error: unknown): string;
}

/**
 * Everything about one canvas tool. Input runs through `parseInput` (unknown fields rejected, required fields
 * checked, enums checked), then the `textFields` caps, then `prepare`, then `execute`. Input errors become
 * `invalid-input` results; other errors are rethrown.
 */
export interface UpdrawCanvasToolDefinition<I = any, P = any> {
  /** Unprefixed snake_case name, unique among all tools. */
  readonly name: string;
  readonly description: UpdrawCanvasToolText;
  readonly inputSchema: UpdrawAgentToolSchema | ((env: UpdrawCanvasToolEnv) => UpdrawAgentToolSchema);
  /** The kinds of actor that get the tool. Defaults to both. */
  readonly actors?: readonly UpdrawToolActorKind[];
  /** Whether the tool is offered with these options. Defaults to always. */
  readonly enabled?: (options: Readonly<UpdrawAgentToolsOptions>) => boolean;
  /** Top-level string fields capped by `maxTextLength`. */
  readonly textFields?: readonly string[];
  /** A removed actor beats input errors (otherwise the model first learns about its mistake). */
  readonly removedFirst?: boolean;
  /** Valid input, as a model would send it; the spec runs every tool with it. */
  readonly example: I;
  /**
   * Turns the parsed input into what `execute` needs, or rejects it with `ctx.invalid()`. Synchronous, so a
   * tool's action starts in the same tick as its call and parallel calls keep their order.
   */
  prepare?(input: I, ctx: UpdrawCanvasToolInputContext): P;
  /** Acts and answers. `ctx.invalid()` still gives an invalid-input answer here. */
  execute(payload: P, ctx: UpdrawCanvasToolContext): Promise<string>;
  /** Turns any other error of `execute` into an answer; `undefined` rethrows it. */
  onError?(error: unknown, ctx: UpdrawCanvasToolContext): string | undefined;
  /**
   * A loading placeholder for the object the tool adds, placed while the model still writes the input (the tool
   * gets `begin`). The object `execute` adds with the addObject action then fills the placeholder in instead.
   */
  readonly placeholder?: UpdrawCanvasToolPlaceholder<I>;
  /**
   * Shows the object the tool changes as loading while the model still writes the input (the tool gets
   * `begin`). The action `execute` performs then fills in the loading action instead.
   */
  readonly loading?: UpdrawCanvasToolLoading<I>;
}

/** How a tool that changes an object shows it loading while the model writes the change (`UpdrawCanvasToolDefinition.loading`). */
export interface UpdrawCanvasToolLoading<I = any> {
  /**
   * The ID of the object the call changes, from the input written so far, or `null` while the input does not
   * name one the tool can change yet. Called as the input streams in, until it returns an ID.
   */
  target(input: Partial<I>, core: UpdrawCore): string | null;
  /** The action that shows the object loading until `fill` resolves with the call's own action. */
  action(objectId: string, fill: () => Promise<UpdrawAgenticAction>): UpdrawAgenticAction;
  /** Whether an action the call performs is the one that fills in the loading action. */
  fills(action: UpdrawAgenticAction, objectId: string): boolean;
}

/** How a tool that adds an object shows it while the model writes it (`UpdrawCanvasToolDefinition.placeholder`). */
export interface UpdrawCanvasToolPlaceholder<I = any> {
  /**
   * Builds the placeholder from the input written so far, or `null` while that is not enough (e.g. its position
   * and size are not known yet). Called as the input streams in, until it returns an object.
   */
  create(input: Partial<I>, ctx: UpdrawCanvasToolInputContext): UpdrawBaseObject<any> | null;
  /** Copies the object `execute` adds onto the placeholder, e.g. a widget's code. Runs inside the action. */
  fill(placeholder: UpdrawBaseObject<any>, content: UpdrawBaseObject<any>): void;
}

/** Freezes a definition. */
export function defineCanvasTool<I, P = I>(definition: UpdrawCanvasToolDefinition<I, P>): UpdrawCanvasToolDefinition<I, P> {
  return Object.freeze({ ...definition });
}

/** What a model should do about a refusal. */
export const AGENT_TOOL_REASON_HINTS: Record<UpdrawAgenticActionFailureReason | 'invalid-input', string> = {
  'invalid-input': 'Fix the input as the message says and try again.',
  aborted: 'The action was stopped on request. Do not retry unless asked.',
  'agent-moved': 'Your cursor was moved by the app while acting. Try again if it still makes sense.',
  'agent-removed': 'You were removed from the canvas. Stop working.',
  'object-removed': 'An object was deleted while you worked on it. Call observe_canvas before continuing.',
  'user-selected': 'The user is working on these objects. Leave them alone or ask the user.',
  'user-interaction': 'The user took over these objects while you worked on them. Leave them alone or ask the user.',
  'collaborator-editing': 'A collaborator is editing these objects. Leave them alone or try later.',
  'claimed-by-agent': 'Another agent is working on these objects. Choose others or try later.',
  'workspace-changed': 'The user switched or reloaded the workspace. Call observe_canvas before continuing.',
  'not-allowed': 'These objects cannot be changed this way.',
  'nothing-to-undo': 'You have nothing to undo.',
  'nothing-to-redo': 'You have nothing to redo.',
  conflict: 'The objects were changed elsewhere meanwhile. Call observe_canvas and try again.',
  'invalid-target': 'Unknown ID, a child inside a group, or the wrong kind of object. Call observe_canvas and use top-level IDs.',
  'engine-disconnected': 'The canvas is not available right now. Try again later.',
  'element-interaction-failed':
    'The message says why. If the widget is not mounted, it is too far outside the view: bring it into view (fit_viewport) and try again. ' +
    'Otherwise call inspect_elements to check the widget and its elements, then try again or tell the user.',
};

/** Hints that read differently for an actor working as the user. */
const USER_REASON_HINTS: Partial<Record<UpdrawAgenticActionFailureReason, string>> = {
  'agent-removed': 'The chat session ended. Stop working.',
  'user-selected': 'The user is working on these objects right now. Leave them alone or ask the user.',
  'not-allowed': 'This is not possible when working as the user.',
};

const DEFAULT_MAX_TEXT_LENGTH = 2000;
const MAX_RESULT_OBJECTS = 10;
/** Input text after which a call that has no placeholder yet stops trying to place one. */
const MAX_PLACEHOLDER_INPUT_LENGTH = 4096;

/** Formats a tool result as the JSON string a tool returns. Use it in app-defined tools to answer the same way. */
export function formatAgentToolResult(result: UpdrawAgentToolResult): string {
  return JSON.stringify(result);
}

/** Thrown for input a model got wrong; becomes `reason: 'invalid-input'`. */
export class UpdrawToolInputError extends Error {}

function hintFor(kind: UpdrawToolActorKind, reason: UpdrawAgenticActionFailureReason | 'invalid-input'): string {
  return (kind === 'user' && reason !== 'invalid-input' ? USER_REASON_HINTS[reason] : undefined) ?? AGENT_TOOL_REASON_HINTS[reason];
}

function kindOf(actor: UpdrawToolActor): UpdrawToolActorKind {
  return actor.kind === 'user' ? 'user' : 'agent';
}

function removedResult(kind: UpdrawToolActorKind): string {
  return formatAgentToolResult({ completed: false, reason: 'agent-removed', hint: hintFor(kind, 'agent-removed') });
}

function refusalResult(
  kind: UpdrawToolActorKind,
  reason: UpdrawAgenticActionFailureReason,
  objectIds?: string[],
  details: Pick<UpdrawAgentToolResult, 'message' | 'element'> = {},
): string {
  return formatAgentToolResult({
    completed: false,
    reason,
    ...(objectIds && objectIds.length > 0 ? { objectIds } : {}),
    ...(details.message ? { message: details.message } : {}),
    ...(details.element ? { element: details.element } : {}),
    hint: hintFor(kind, reason),
  });
}

function errorResult(kind: UpdrawToolActorKind, error: unknown): string {
  if (error instanceof UpdrawToolInputError) {
    return formatAgentToolResult({ completed: false, reason: 'invalid-input', message: error.message, hint: hintFor(kind, 'invalid-input') });
  }
  if (error instanceof Error && /not ready/.test(error.message)) {
    return formatAgentToolResult({ completed: false, reason: 'engine-disconnected', hint: hintFor(kind, 'engine-disconnected') });
  }
  throw error;
}

/** Resolves a text for an environment. */
export function canvasToolText(text: UpdrawCanvasToolText, env: UpdrawCanvasToolEnv): string {
  if (typeof text === 'function') {
    return text(env);
  }
  return typeof text === 'string' ? text : text[env.kind];
}

/** Resolves a definition's input schema for an environment. */
export function canvasToolSchema(definition: UpdrawCanvasToolDefinition, env: UpdrawCanvasToolEnv): UpdrawAgentToolSchema {
  return typeof definition.inputSchema === 'function' ? definition.inputSchema(env) : definition.inputSchema;
}

/** Whether a definition is offered to this actor with these options (before `only`). */
export function isCanvasToolOffered(definition: UpdrawCanvasToolDefinition, env: UpdrawCanvasToolEnv): boolean {
  return (!definition.actors || definition.actors.includes(env.kind)) && (definition.enabled?.(env.options) ?? true);
}

/**
 * Turns a definition into a tool of an actor. The tool is a self-contained object (its `run` works when
 * copied, as tool runners do) and never throws for mistakes of the model.
 */
export function bindCanvasTool(actor: UpdrawToolActor, definition: UpdrawCanvasToolDefinition, options: UpdrawAgentToolsOptions = {}): UpdrawAgentTool {
  const kind = kindOf(actor);
  const env: UpdrawCanvasToolEnv = { kind, options };
  const inputSchema = canvasToolSchema(definition, env);
  const schemaNode = inputSchema as unknown as UpdrawJsonSchemaNode;
  const maxTextLength = options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH;
  const instant = !!options.instant;
  const invalid = (message: string): never => {
    throw new UpdrawToolInputError(message);
  };
  const inputContext: UpdrawCanvasToolInputContext = { kind, options, invalid };

  const performDirectly: ToolPerform = (action, performOptions, context) =>
    performAsTool(actor, kind, action, context, instant, performOptions?.describeObjects ?? true);

  /** One call: input checks, `prepare`, then `execute`; `perform` and `whenIdle` can stand in for the actor's. */
  const runTool: ToolRun = async (input, context, perform, whenIdle) => {
    let payload: unknown;
    try {
      const parsed = parseInput(input, schemaNode);
      for (const field of definition.textFields ?? []) {
        const value = parsed[field];
        if (typeof value === 'string' && value.length > maxTextLength) {
          invalid(`"${field}" is longer than ${maxTextLength} characters. Split it into several actions.`);
        }
      }
      payload = definition.prepare ? definition.prepare(parsed, inputContext) : parsed;
    } catch (error) {
      if (definition.removedFirst && !actor.isAdded) {
        return removedResult(kind);
      }
      return errorResult(kind, error);
    }

    const ctx: UpdrawCanvasToolContext = {
      ...inputContext,
      signal: context?.signal,
      instant,
      get isAdded() {
        return actor.isAdded;
      },
      get core() {
        return actor._owner ?? null;
      },
      perform: (action, performOptions) => (perform ?? performDirectly)(action, performOptions, context),
      observe: observeOptions => actor.observe(observeOptions),
      inspectElements: (objectId, inspectOptions) => actor._inspectElements(objectId, inspectOptions),
      whenIdle: whenIdle ?? (() => actor._whenIdle()),
      removedResult: () => removedResult(kind),
      refusalResult: (reason, objectIds) => refusalResult(kind, reason, objectIds),
      errorResult: error => errorResult(kind, error),
    };
    try {
      // Called before the first await, so the tool's action starts in the same tick as the call.
      return await definition.execute(payload, ctx);
    } catch (error) {
      if (error instanceof UpdrawToolInputError) {
        return errorResult(kind, error);
      }
      const answer = definition.onError?.(error, ctx);
      if (answer === undefined) {
        throw error;
      }
      return answer;
    }
  };

  const tool: UpdrawAgentTool = {
    name: `${options.prefix ?? ''}${definition.name}`,
    description: canvasToolText(definition.description, env),
    inputSchema,
    run: (input: unknown, context?: UpdrawAgentToolContext) => runTool(input, context),
  };
  const placeholder = definition.placeholder;
  if (placeholder) {
    tool.begin = context => beginWithPlaceholder(placeholder, context, runTool, performDirectly, inputContext, () => actor.isAdded);
  }
  const loading = definition.loading;
  if (loading) {
    tool.begin = context => beginWithLoading(loading, context, runTool, performDirectly, () => (actor.isAdded ? (actor._owner ?? null) : null));
  }
  return tool;
}

/** Performs an action for a call of a tool, with that call's context. */
type ToolPerform = (action: UpdrawAgenticAction, options: { describeObjects?: boolean } | undefined, context: UpdrawAgentToolContext | undefined) => Promise<string>;

/** Runs one call of a tool; `perform` and `whenIdle` can stand in for the actor's. */
type ToolRun = (input: unknown, context: UpdrawAgentToolContext | undefined, perform?: ToolPerform, whenIdle?: () => Promise<void>) => Promise<string>;

/**
 * A call that shows the object it changes as loading once its input names it, and applies the change when it
 * finishes: the action `execute` performs fills in the loading action, so loading and changing are one action.
 */
function beginWithLoading(
  loading: UpdrawCanvasToolLoading,
  context: UpdrawAgentToolContext,
  runTool: ToolRun,
  perform: ToolPerform,
  core: () => UpdrawCore | null,
): UpdrawAgentToolCall {
  let ended = false;
  let gaveUp = false;
  let objectId: string | null = null;
  /** The loading action, once started: its answer is the call's answer. */
  let placing: Promise<string> | null = null;
  let resolveFill!: (action: UpdrawAgenticAction) => void;
  let rejectFill!: (reason: unknown) => void;
  const fill = new Promise<UpdrawAgenticAction>((resolve, reject) => {
    resolveFill = resolve;
    rejectFill = reject;
  });
  fill.catch(() => undefined);
  const dropLoading = () => rejectFill(new Error('The tool call ended without a change.'));
  /** Resolves once the loading action runs, i.e. the actions queued before it are done. */
  let markStarted!: () => void;
  const started = new Promise<void>(resolve => (markStarted = resolve));

  return {
    update(inputText) {
      const owner = core();
      if (ended || placing || gaveUp || !owner) {
        return;
      }
      const long = inputText.length > MAX_PLACEHOLDER_INPUT_LENGTH;
      try {
        const input = parsePartialJson(long ? inputText.slice(0, MAX_PLACEHOLDER_INPUT_LENGTH) : inputText);
        if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
          objectId = loading.target(input, owner);
        }
      } catch {
        // Input the model got wrong so far: the call reports it when it finishes.
      }
      if (objectId) {
        const action = loading.action(objectId, () => {
          markStarted();
          return fill;
        });
        placing = perform(action, undefined, context);
        placing.catch(() => undefined);
      } else if (long) {
        gaveUp = true;
      }
    },

    async finish(input) {
      ended = true;
      const placed = placing;
      const id = objectId;
      if (!placed || !id) {
        return runTool(input, context);
      }
      let filled = false;
      // The call's own action runs inside the loading one: waiting for the actor to be idle would wait for itself.
      const whenStarted = () => Promise.race([started, placed.then(() => undefined, () => undefined)]);
      try {
        return await runTool(
          input,
          context,
          (action, performOptions, callContext) => {
            if (filled || !loading.fills(action, id)) {
              return perform(action, performOptions, callContext);
            }
            filled = true;
            resolveFill(action);
            return placed;
          },
          whenStarted,
        );
      } finally {
        if (!filled) {
          // Invalid input, or the tool changed nothing: the loading action rolls back.
          dropLoading();
          await placed.catch(() => undefined);
        }
      }
    },

    async cancel() {
      if (ended) {
        return;
      }
      ended = true;
      dropLoading();
      await placing?.catch(() => undefined);
    },
  };
}

/**
 * A call that places a loading placeholder once its input is far enough along, and fills it in when it finishes:
 * the object `execute` adds becomes the placeholder's fill, so placing and filling are one action.
 */
function beginWithPlaceholder(
  placeholder: UpdrawCanvasToolPlaceholder,
  context: UpdrawAgentToolContext,
  runTool: ToolRun,
  perform: ToolPerform,
  inputContext: UpdrawCanvasToolInputContext,
  isAdded: () => boolean,
): UpdrawAgentToolCall {
  let ended = false;
  let gaveUp = false;
  /** The addObject action of the placeholder, once placed: its answer is the call's answer. */
  let placing: Promise<string> | null = null;
  let resolveFill!: (fill: UpdrawAgenticFill) => void;
  let rejectFill!: (reason: unknown) => void;
  const fill = new Promise<UpdrawAgenticFill>((resolve, reject) => {
    resolveFill = resolve;
    rejectFill = reject;
  });
  // Rejected when the call ends without filling the placeholder; the action rolls back.
  fill.catch(() => undefined);
  const dropPlaceholder = () => rejectFill(new Error('The tool call ended without filling its placeholder.'));

  return {
    update(inputText) {
      if (ended || placing || gaveUp || !isAdded()) {
        return;
      }
      // What a placeholder needs comes first in the input: only its beginning is read, so a call that begins late,
      // with much of its input written, still gets its placeholder.
      const long = inputText.length > MAX_PLACEHOLDER_INPUT_LENGTH;
      let object: UpdrawBaseObject<any> | null = null;
      try {
        const input = parsePartialJson(long ? inputText.slice(0, MAX_PLACEHOLDER_INPUT_LENGTH) : inputText);
        if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
          object = placeholder.create(input, inputContext);
        }
      } catch {
        // Input the model got wrong so far: the call reports it when it finishes.
      }
      if (object) {
        placing = perform({ type: 'addObject', object, fill }, undefined, context);
        placing.catch(() => undefined);
      } else if (long) {
        gaveUp = true;
      }
    },

    async finish(input) {
      ended = true;
      const placed = placing;
      if (!placed) {
        return runTool(input, context);
      }
      let filled = false;
      try {
        return await runTool(input, context, (action, performOptions, callContext) => {
          if (filled || action.type !== 'addObject' || action.fill) {
            return perform(action, performOptions, callContext);
          }
          // The object the tool adds fills the placeholder in; the placeholder's action answers for it.
          filled = true;
          resolveFill({ content: action.object, apply: placeholder.fill });
          return placed;
        });
      } finally {
        if (!filled) {
          // Invalid input, or the tool added nothing: the placeholder goes.
          dropPlaceholder();
          await placed.catch(() => undefined);
        }
      }
    },

    async cancel() {
      if (ended) {
        return;
      }
      ended = true;
      dropPlaceholder();
      // Resolves once the placeholder's action has rolled back.
      await placing?.catch(() => undefined);
    },
  };
}

/** Performs a tool's action and reports the result as the tool's JSON answer. */
async function performAsTool(
  actor: UpdrawToolActor,
  kind: UpdrawToolActorKind,
  action: UpdrawAgenticAction,
  context: UpdrawAgentToolContext | undefined,
  instant: boolean,
  describeObjects: boolean,
): Promise<string> {
  if (!actor.isAdded) {
    return removedResult(kind);
  }
  const options: UpdrawAgenticActionOptions = {};
  if (context?.signal) options.signal = context.signal;
  if (instant) options.instant = true;
  let result;
  try {
    result = await actor.perform(action, options);
  } catch (error) {
    if (error instanceof UpdrawAgentActionError) {
      // Inside agent.task(), refusals throw; a tool reports them like everywhere else.
      result = error.result;
    } else {
      throw error;
    }
  }
  // The element an interaction acted on, described for the model.
  const element = result.element ? toCanvasElement(result.element) : undefined;
  if (result.completed) {
    const objects = describeObjects ? describeResultObjects(actor, result.objectIds ?? []) : [];
    return formatAgentToolResult({
      completed: true,
      objectIds: result.objectIds ?? [],
      ...(objects.length > 0 ? { objects } : {}),
      ...(element ? { element } : {}),
    });
  }
  return refusalResult(kind, result.reason ?? 'conflict', result.objectIds, { message: result.message, element });
}

/** Snapshots of the objects a completed action created or changed, so the model needs no extra observe call. */
function describeResultObjects(actor: UpdrawToolActor, objectIds: string[]): UpdrawCanvasObject[] {
  if (objectIds.length === 0) {
    return [];
  }
  try {
    return actor._describeObjects(objectIds.slice(0, MAX_RESULT_OBJECTS));
  } catch {
    return [];
  }
}

/** Input checks for `prepare`, with the messages models get. */
export const toolInput = {
  finite(value: unknown, field: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new UpdrawToolInputError(`"${field}" must be a number.`);
    }
    return value;
  },
  positive(value: unknown, field: string): number {
    const number = toolInput.finite(value, field);
    if (number <= 0) {
      throw new UpdrawToolInputError(`"${field}" must be greater than 0.`);
    }
    return number;
  },
  string(value: unknown, field: string): string {
    if (typeof value !== 'string') {
      throw new UpdrawToolInputError(`"${field}" must be a string.`);
    }
    return value;
  },
};

/**
 * Parses and checks a model's input against a tool schema: JSON strings are parsed (OpenAI sends them),
 * `null` counts as absent (strict modes send it for optional fields), unknown fields are rejected with their
 * path, and the result is a fresh plain object built from the known fields only.
 */
function parseInput(input: unknown, schema: UpdrawJsonSchemaNode): Record<string, unknown> {
  let value = input;
  if (typeof value === 'string') {
    try {
      value = value.trim() === '' ? {} : JSON.parse(value);
    } catch {
      throw new UpdrawToolInputError('Input is not valid JSON.');
    }
  }
  if (value === undefined || value === null) {
    value = {};
  }
  const result = pick(value, schema, '');
  return (result ?? {}) as Record<string, unknown>;
}

function pick(value: unknown, schema: UpdrawJsonSchemaNode, path: string): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (schema.type === 'object' && schema.properties) {
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new UpdrawToolInputError(path ? `"${path}" must be an object.` : 'Input must be an object.');
    }
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      const childSchema = Object.prototype.hasOwnProperty.call(schema.properties, key) ? schema.properties[key] : undefined;
      if (!childSchema) {
        throw new UpdrawToolInputError(`Unknown property "${childPath}". Use ${Object.keys(schema.properties).join(', ') || 'no properties'}.`);
      }
      const picked = pick(child, childSchema, childPath);
      if (picked !== undefined) {
        result[key] = picked;
      }
    }
    for (const key of schema.required ?? []) {
      if (result[key] === undefined) {
        throw new UpdrawToolInputError(`"${path ? `${path}.${key}` : key}" is required.`);
      }
    }
    return result;
  }
  if (schema.type === 'array' && schema.items) {
    if (!Array.isArray(value)) {
      throw new UpdrawToolInputError(`"${path}" must be an array.`);
    }
    return value.map((item, index) => pick(item, schema.items!, `${path}[${index}]`));
  }
  if (schema.enum && !schema.enum.includes(value as string)) {
    throw new UpdrawToolInputError(`"${path}" must be one of ${schema.enum.join(', ')}.`);
  }
  // Scalars: type checks with the right messages happen in the tool's own checks.
  return value;
}
