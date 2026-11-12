import type { KritzelAgent } from '../classes/agent/agent.class';
import type { KritzelAgentTool, KritzelAgentToolSchema } from './agent.interface';
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
 * An event of a streamed answer. Text deltas are joined into text parts; `part` adds a complete part (e.g. a
 * tool call); `message` replaces everything streamed so far; `finish` ends the answer; `error` ends it with an
 * error, e.g. when the model fails after your server has started to answer.
 */
export type KritzelChatStreamEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'part'; part: KritzelChatPart }
  | { type: 'message'; message: KritzelChatMessage }
  | { type: 'finish'; stopReason?: KritzelChatStopReason; providerData?: KritzelChatProviderData }
  | { type: 'error'; message: string };

/** Options passed to a transport call. */
export interface KritzelChatTransportOptions {
  /** Aborted when the user stops the response. */
  signal: AbortSignal;
}

/**
 * Sends one model step to your server, which holds the API key and talks to the model. Returns the answer, or
 * a stream of events (version 1 waits for the whole stream before running tools).
 */
export type KritzelChatTransport = (
  request: KritzelChatRequest,
  options: KritzelChatTransportOptions,
) => Promise<KritzelChatResponse | AsyncIterable<KritzelChatStreamEvent>> | AsyncIterable<KritzelChatStreamEvent>;

/** Options of `new KritzelChatSession()`. */
export interface KritzelChatSessionOptions {
  /** Sends model steps to your server. */
  transport: KritzelChatTransport;
  /**
   * The agent the model acts as, with its own cursor, selection and history. Without one, the model works as
   * the user: instantly, on the user's selection, and its changes undo like the user's own (one step per prompt).
   */
  agent?: KritzelAgent;
  /** App-defined tools added to the canvas tools. Their names must not clash with them. */
  tools?: KritzelAgentTool[];
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

/** Events of a `KritzelChatSession`. */
export interface KritzelChatSessionEventMap {
  /** Messages or `running` changed. */
  change: void;
  /** A message was added. */
  message: KritzelChatMessage;
  /** A prompt ended. */
  end: KritzelChatSendResult;
}
