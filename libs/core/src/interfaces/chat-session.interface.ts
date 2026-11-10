import type { KritzelAgent } from '../classes/agent/agent.class';
import type { KritzelAgentTool, KritzelAgentToolContext, KritzelAgentToolSchema, KritzelAgentToolsOptions, KritzelCanvasSnapshot, KritzelObserveOptions } from './agent.interface';
import type { KritzelAgenticAction, KritzelAgenticActionOptions, KritzelAgenticActionResult } from './agentic-action.interface';
import type { KritzelChatBoxChip } from './chat-box.interface';

/** Version of the chat protocol between a `KritzelChatSession` and your server. */
export const KRITZEL_CHAT_PROTOCOL_VERSION = 1;

/**
 * Provider-specific data your server attaches to a part or message, e.g. a reasoning signature or a provider
 * message ID it needs back on the next request. The session stores it and sends it back unchanged.
 */
export type KritzelChatProviderData = Record<string, unknown>;

/** Text written by the user or the model. */
export interface KritzelChatTextPart {
  type: 'text';
  text: string;
  providerData?: KritzelChatProviderData;
}

/** An image, as base64 `data` or a `url`. */
export interface KritzelChatImagePart {
  type: 'image';
  /** e.g. `'image/png'`. */
  mediaType: string;
  /** Base64 data without a `data:` prefix. */
  data?: string;
  url?: string;
  providerData?: KritzelChatProviderData;
}

/** A tool the model wants to call. The session runs it and answers with a `tool-result`. */
export interface KritzelChatToolCallPart {
  type: 'tool-call';
  /** Unique within the conversation; the result refers to it. */
  id: string;
  name: string;
  /** The tool's input, as an object or a JSON string. */
  input: unknown;
  providerData?: KritzelChatProviderData;
}

/** The answer to a `tool-call`. Every tool call gets exactly one result. */
export interface KritzelChatToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  name: string;
  /** What the tool returned, usually JSON. */
  output: string;
  /** Set when the tool failed or did not run (unknown tool, stopped, interrupted). */
  isError?: boolean;
  providerData?: KritzelChatProviderData;
}

/** A part of a chat message. */
export type KritzelChatPart = KritzelChatTextPart | KritzelChatImagePart | KritzelChatToolCallPart | KritzelChatToolResultPart;

/**
 * A message of the conversation. `user` messages hold what the user sent, `assistant` messages what the model
 * answered (text and tool calls), `tool` messages the results of the tool calls of the assistant message before.
 */
export interface KritzelChatMessage {
  role: 'user' | 'assistant' | 'tool';
  parts: KritzelChatPart[];
  providerData?: KritzelChatProviderData;
}

/** A tool as sent to the server: what the model needs to know to call it. */
export interface KritzelChatToolDefinition {
  name: string;
  description: string;
  inputSchema: KritzelAgentToolSchema;
}

/** What the session sends to your server for each model step. */
export interface KritzelChatRequest {
  version: typeof KRITZEL_CHAT_PROTOCOL_VERSION;
  /** Instructions for the model; your server decides how to use them (and should add its own). */
  system?: string;
  /** The whole conversation so far. */
  messages: KritzelChatMessage[];
  tools: KritzelChatToolDefinition[];
  /** Whether the tools act as an agent with its own cursor or as the user. */
  mode: 'agent' | 'user';
  /** App data from the `context` option, e.g. a document or user ID. */
  context?: Record<string, unknown>;
}

/** Why the model stopped. */
export type KritzelChatStopReason = 'end' | 'tool-calls' | 'max-tokens' | 'refusal' | 'other';

/** What your server answers: the model's message. */
export interface KritzelChatResponse {
  version?: typeof KRITZEL_CHAT_PROTOCOL_VERSION;
  message: KritzelChatMessage;
  stopReason?: KritzelChatStopReason;
}

/**
 * An event of a streamed answer.
 * - `text-delta`: joined into text parts.
 * - `tool-call-start`, `tool-call-delta` (optional): the model began a tool call, or wrote more of its input as
 *   JSON text. They let the app follow a call while the model writes it; a call never runs from them alone.
 * - `part`: a complete part, e.g. a tool call. A tool-call part with the ID of a started call completes that call;
 *   its name and input win over the start and the deltas. The call can run right away (see `eagerToolCalls`), so
 *   a part is final: don't take it back later.
 * - `message`: replaces everything streamed so far. Complete calls it leaves out are dropped unless they already
 *   started running; calls still being written wait for their part; calls it adds run once the answer has ended.
 *   Give tool calls IDs when you send them both as parts and in a message.
 * - `finish`: ends the answer.
 *
 * Close every call you start with its part. When its input is not valid JSON (or was cut off), send the raw
 * text as a string `input`: the tool answers with an error the model can act on. A started call without a part
 * when the answer ends is dropped. Events without an ID, and of other types, are ignored.
 */
export type KritzelChatStreamEvent =
  | { type: 'text-delta'; text: string }
  | {
      type: 'tool-call-start';
      /** Unique within the conversation; the call's deltas and its part repeat it. */
      id: string;
      name: string;
    }
  | {
      type: 'tool-call-delta';
      id: string;
      /** More of the input's JSON text; the deltas joined are the input as written so far. */
      inputDelta: string;
    }
  | { type: 'part'; part: KritzelChatPart }
  | { type: 'message'; message: KritzelChatMessage }
  | { type: 'finish'; stopReason?: KritzelChatStopReason; providerData?: KritzelChatProviderData };

/** Options passed to a transport call. */
export interface KritzelChatTransportOptions {
  /** Aborted when the user stops the response. */
  signal: AbortSignal;
}

/**
 * Sends one model step to your server, which holds the API key and talks to the model. Returns the answer, or
 * a stream of events. Each tool call of a streamed answer runs as soon as its part arrives, while the stream
 * goes on (see `eagerToolCalls`); the calls of a whole answer run once it is in.
 */
export type KritzelChatTransport = (
  request: KritzelChatRequest,
  options: KritzelChatTransportOptions,
) => Promise<KritzelChatResponse | AsyncIterable<KritzelChatStreamEvent>> | AsyncIterable<KritzelChatStreamEvent>;

/**
 * Whoever a chat session acts as: its agent, or the local user when it has none. App tools act through it, so
 * their changes behave like the canvas tools' changes: they undo with the rest of the prompt, the stop button
 * rolls them back and, with an agent, they are the agent's changes.
 */
export interface KritzelChatActor {
  /** `'agent'` with an agent, otherwise `'user'`. */
  readonly kind: 'agent' | 'user';
  /**
   * Performs an action, e.g. `{ type: 'addObject', object }` to place an object the app built. The session adds
   * the tool call's abort signal and, in agent mode, its `instant` option. Resolves with `completed: false` and a
   * `reason` when the action was refused or stopped.
   */
  perform(action: KritzelAgenticAction, options?: KritzelAgenticActionOptions): Promise<KritzelAgenticActionResult>;
  /** What the actor sees of the canvas, as the `observe_canvas` tool returns it. */
  observe(options?: KritzelObserveOptions): Promise<KritzelCanvasSnapshot>;
}

/** Context a chat session passes to an app tool. */
export interface KritzelChatToolContext extends KritzelAgentToolContext {
  /** Aborted when the user stops the response. */
  signal: AbortSignal;
  /** Acts on the canvas as the session: its agent, or the user. */
  actor: KritzelChatActor;
}

/**
 * An app-defined tool of a chat session. Like `KritzelAgentTool`, but `run` gets the session's actor to act on
 * the canvas with. Return a JSON result, e.g. with `formatAgentToolResult()`.
 */
export interface KritzelChatTool extends Omit<KritzelAgentTool, 'run'> {
  run: (input: unknown, context: KritzelChatToolContext) => Promise<string>;
}

/** Options of `new KritzelChatSession()`. */
export interface KritzelChatSessionOptions {
  /** Sends model steps to your server. */
  transport: KritzelChatTransport;
  /**
   * The agent the model acts as, with its own cursor, selection and history. Without one, the model works as
   * the user: instantly, on the user's selection, and its changes undo like the user's own (one step per prompt).
   */
  agent?: KritzelAgent;
  /**
   * Which optional canvas tools the model gets: `create_image` (on by default, SVG only; `{ urls: true }` also
   * loads images from URLs) and `create_iframe` (off by default; places widgets of model-written code).
   */
  canvasTools?: Pick<KritzelAgentToolsOptions, 'images' | 'iframes'>;
  /** App-defined tools added to the canvas tools. Their names must not clash with them. */
  tools?: KritzelChatTool[];
  /** Instructions sent with every request. */
  system?: string;
  /** App data sent with every request, or a function returning it (called per request). */
  context?: Record<string, unknown> | (() => Record<string, unknown> | undefined);
  /** Most model steps per prompt. Defaults to 25. */
  maxSteps?: number;
  /** A conversation to continue, e.g. restored from storage. Tool calls without a result get one. */
  messages?: KritzelChatMessage[];
  /** Agent mode: skips the cursor animation. Actions working as the user are always instant. */
  instant?: boolean;
  /** Agent mode: the agent's status while the model thinks. `false` keeps the status. Defaults to `'Thinking…'`. */
  thinkingStatus?: string | false;
  /**
   * Streamed answers: runs each tool call as soon as its part arrives, while the model is still writing the rest
   * of the answer. Defaults to `true`. `false` runs the calls once the answer has ended, like those of answers
   * that are not streamed, e.g. for a server whose model can take back calls it already sent.
   */
  eagerToolCalls?: boolean;
}

/** What to send: text, or text with chips and images. */
export type KritzelChatInput =
  | string
  | {
      text: string;
      /** What the prompt refers to, e.g. the chat box chips. Sent as a text part after the prompt. */
      chips?: KritzelChatBoxChip[];
      images?: Omit<KritzelChatImagePart, 'type'>[];
    };

/** How `send()` ended. */
export interface KritzelChatSendResult {
  /**
   * `'completed'`: the model answered without more tool calls. `'stopped'`: `stop()` was called. `'step-limit'`:
   * `maxSteps` was reached. `'error'`: the transport or a tool threw (see `error`). `'busy'`: this session, its
   * agent or (working as the user) another session of the editor was already running. `'detached'`: the session
   * is not bound to an editor, or its agent was removed, or the workspace changed while it ran.
   */
  status: 'completed' | 'stopped' | 'step-limit' | 'error' | 'busy' | 'detached';
  error?: unknown;
}

/** Where a tool call of a streamed answer is. */
export type KritzelChatToolCallState = 'started' | 'input' | 'ready' | 'running' | 'done' | 'discarded';

/**
 * Progress of a tool call of a streamed answer. A call is reported `'started'`, `'input'` for each piece of its
 * input, and `'ready'` once its part arrived (again if a `message` event changed it). `'running'` comes right
 * before its tool runs, which can be while the answer still streams. Each call ends exactly once: `'done'` (it
 * has its result) or `'discarded'` (it is not part of the conversation and never ran: its part never arrived, a
 * `message` event left it out, or the answer was stopped or failed before any of its calls ran). An ID that ended
 * is not reported again. Calls of answers that are not streamed are not reported.
 */
export interface KritzelChatToolCallUpdate {
  /** As in the tool-call part and its tool result. */
  id: string;
  name: string;
  state: KritzelChatToolCallState;
  /** The input streamed so far as JSON text (the joined deltas); usually incomplete before `'ready'`. */
  inputText: string;
  /** With `'input'`: the text that just arrived. */
  inputDelta?: string;
  /** From `'ready'` on: the input of the tool-call part (an object or a JSON string). */
  input?: unknown;
  /** With `'done'`: the result the model gets. */
  result?: KritzelChatToolResultPart;
  /** With `'done'`: whether the tool ran (`false`: the prompt ended first, or there is no such tool). */
  ran?: boolean;
}

/** Events of a `KritzelChatSession`. */
export interface KritzelChatSessionEventMap {
  /** Messages or `running` changed. */
  change: void;
  /** A message was added. */
  message: KritzelChatMessage;
  /**
   * A tool call of a streamed answer made progress: once per input delta while the model writes it. Calls are
   * written and ready before the answer is in `messages`; they run and end before it with eager tool calls, or
   * after it (with `eagerToolCalls: false`, and for calls that a `message` event added). Throttle what you render.
   */
  'tool-call': KritzelChatToolCallUpdate;
  /** A prompt ended. */
  end: KritzelChatSendResult;
}
