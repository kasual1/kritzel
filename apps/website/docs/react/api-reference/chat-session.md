---
sidebar_label: Chat Session
displayed_sidebar: tutorialSidebar
title: "Chat Session API Reference | Updraw for React"
description: "API reference for UpdrawChatSession: options, properties, methods, events, the chat protocol types, createHttpTransport, and createScriptedTransport."
toc_max_heading_level: 2
---

# Chat Session

`UpdrawChatSession` connects the chat box to an LLM through your server. It runs the tool loop in the browser: it sends the conversation through a transport, runs the tool calls of the answer on the canvas, and sends the results back until the model is done. Bind it to the editor with the `chatSession` prop:

```ts
import { createHttpTransport, UpdrawChatSession } from '@updraw/react-editor';

const session = new UpdrawChatSession({ transport: createHttpTransport('/api/chat') });
```

For a guided introduction, see [Agents](../advanced/agents.md). The `chatSession` prop is listed in the [Editor API Reference](./editor.md#ui-elements).

## Constructor

```ts
new UpdrawChatSession(options: UpdrawChatSessionOptions)
```

Throws a `TypeError` when `transport` is not a function or `maxSteps` is not a positive integer.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| transport | UpdrawChatTransport | — | Required. Sends one step of the conversation to your server. See [UpdrawChatTransport](#updrawchattransport). |
| agent | UpdrawAgent | — | The agent the model acts as. Without one, the model works as the user. The editor adds the agent when the session is bound. |
| canvasTools | `{ images?: boolean \| { urls?: boolean }; iframes?: boolean; viewport?: boolean }` | — | Which optional canvas tools the model gets. `images` (default `true`, SVG only) offers `create_image`, which places images drawn as SVG markup by the model; `{ urls: true }` also loads images from URLs that the model chooses, fetched by the user's browser. `iframes` (default `false`) offers `create_iframe`, `read_iframe`, and `update_iframe`, which place, read, and change widgets of model-written code. `viewport` (default `true`) offers `set_viewport` and `fit_viewport`, which pan and zoom the local user's view. See [`tools()`](./agent.md#tools). |
| system | string | — | Instructions sent with every request. |
| context | `Record<string, unknown> \| () => Record<string, unknown> \| undefined` | — | App data sent with every request. A function is called for each request. |
| tools | UpdrawChatTool[] | `[]` | Your own tools, added to the canvas tools. A name that clashes with a canvas tool ends the prompt with `status: 'error'`. `run()` gets the `toolCallId` of the call and the session's `actor` in its context, and an optional `begin()` lets a tool act while the model still writes the call. See [UpdrawChatTool](#updrawchattool). |
| maxSteps | number | `25` | Most model steps per prompt. |
| messages | UpdrawChatMessage[] | `[]` | A conversation to continue. Tool calls without a result get an `'aborted'` result. |
| instant | boolean | `false` | Agent mode: skips the cursor animation. Working as the user is always instant. |
| thinkingStatus | string \| false | `'Thinking…'` | Agent mode: the agent's status while the model thinks. `false` keeps the status. |
| eagerToolCalls | boolean | `true` | Streamed answers: runs each tool call as soon as its part arrives and the calls started before it have run, while the model still writes the rest of the answer. `false` runs the calls once the answer has ended, like those of answers that are not streamed, for example for a server whose model can take back calls it already sent. See [Streaming](../advanced/agents.md#streaming). |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| messages | readonly UpdrawChatMessage[] | The conversation so far. A new array after every change. |
| running | boolean | Whether a prompt is running. |
| mode | 'agent' \| 'user' | `'agent'` with an agent, otherwise `'user'`. |
| agent | UpdrawAgent \| null | The agent the model acts as. |
| isAttached | boolean | Whether the session is bound to an editor. |
| tools | UpdrawAgentTool[] | The tools the model gets: the canvas tools of the mode plus your own. |

## Methods

### send

Sends a prompt and runs the tool loop until the model answers without tool calls. Never rejects; the result tells how the prompt ended. Throws a `TypeError` for an empty prompt.

```ts
send(input: UpdrawChatInput): Promise<UpdrawChatSendResult>
```

Working as the user, all changes of one prompt become one step of the user's history.

### stop

Stops the running prompt: the transport's `signal` aborts, the running action is rolled back, and the remaining tool calls get an `'aborted'` result. Placeholders of calls that the model was still writing are removed. Changes of earlier actions are kept. A streamed answer that is stopped after one of its tool calls ran is kept as far as it got, with the results of its calls; otherwise it is dropped.

```ts
stop(): void
```

### on

Subscribes to an event. Returns a function that unsubscribes.

```ts
on<K extends keyof UpdrawChatSessionEventMap>(event: K, listener: (payload: UpdrawChatSessionEventMap[K]) => void): () => void
```

### whenIdle

Resolves when no prompt is running.

```ts
whenIdle(): Promise<void>
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| change | void | `messages` or `running` changed. |
| message | UpdrawChatMessage | A message was added. |
| tool-call | UpdrawChatToolCallUpdate | A tool call of a streamed answer made progress: once per input delta while the model writes it. Calls are written and ready before the answer is in `messages`. They run and end before it with eager tool calls, or after it with `eagerToolCalls: false` and for calls that a `message` event added. Throttle what you render from it. See [UpdrawChatToolCallUpdate](#updrawchattoolcallupdate). |
| end | UpdrawChatSendResult | A prompt ended. |

## Binding

The editor binds the session given in `chatSession` and unbinds it when the editor is removed from the page. A session that is replaced finishes its running prompt first. A session belongs to one editor at a time. While the session is bound:

- The chat box sends its prompts to the session, with `chatBoxChips` as chips, unless a `chatSubmit` listener calls `preventDefault()`.
- The chat box shows its progress while the session runs, and its stop button calls `stop()`.
- Working as the user, one session runs at a time in the editor. With an agent, one session runs at a time per agent. Others resolve with `status: 'busy'`.
- A running prompt ends with `status: 'detached'` when the session is unbound, its agent is removed, or the workspace changes.

## Functions

### createHttpTransport

Returns a transport that posts each request as JSON to your server and reads its answer. Takes the URL of your endpoint, or options:

```ts
createHttpTransport(urlOrOptions: string | URL | UpdrawHttpTransportOptions): UpdrawChatTransport
```

Throws a `TypeError` without a URL.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string \| URL | — | Required. The endpoint of your server, for example `'/api/chat'`. |
| headers | `HeadersInit \| (request: UpdrawChatRequest) => HeadersInit \| Promise<HeadersInit>` | — | Headers sent with every request, for example `Authorization`. A function is called for each request. |
| credentials | RequestCredentials | — | Whether cookies are sent, as in `fetch()`. |
| fetch | typeof fetch | global `fetch` | The `fetch` to use, for example in tests. |

The request has the headers `Content-Type: application/json` and `Accept: application/x-ndjson, text/event-stream, application/json`, unless `headers` sets them. The `Content-Type` of the answer decides how it is read:

| Content-Type | Answer |
|--------------|--------|
| `application/x-ndjson` (or another type containing `ndjson` or `jsonl`) | One `UpdrawChatStreamEvent` as JSON per line. Blank lines are skipped. |
| `text/event-stream` | Server-sent events. The `data` of each event without an `event` field, or with `event: message`, is one `UpdrawChatStreamEvent` as JSON. Other events, comments, and `data: [DONE]` are skipped. |
| anything else | One `UpdrawChatResponse` as JSON. |

An answer with an error status throws a [`UpdrawChatHttpError`](#updrawchathttperror). Invalid JSON throws an `Error`. Both end the prompt with `status: 'error'`. Stopping the session aborts the request.

### createScriptedTransport

Returns a transport that answers from a script instead of a model, for demos and tests. The steps answer the model steps in order, across prompts; once they run out, the last step answers. With a function, the script decides per request. The delays reject with an `AbortError` when the request is aborted.

```ts
createScriptedTransport(
  steps: UpdrawScriptedStep[] | ((request: UpdrawChatRequest, index: number) => string | UpdrawScriptedAnswer),
  options?: UpdrawScriptedTransportOptions,
): UpdrawChatTransport
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| delayMs | number | `0` | How long each answer takes, like a model thinking. The `delayMs` of an answer overrides it. |
| stream | `boolean \| { chunkSize?: number; chunkDelayMs?: number }` | `false` | Streams each answer like a model: its text as `text-delta` chunks, each tool call as `tool-call-start`, the JSON of its input as `tool-call-delta` chunks, and its `part`, then the extra `parts` and `finish`. The messages are the same as without streaming. `chunkSize` is in characters (default `16`), `chunkDelayMs` is the wait before each chunk (default `0`). |

| Type | Description |
|------|-------------|
| UpdrawScriptedStep | `string` (a text answer), `UpdrawScriptedAnswer`, or `(request, index) => string \| UpdrawScriptedAnswer`. |
| UpdrawScriptedAnswer | `{ text?: string; toolCalls?: { tool: string; input?: object; id?: string }[]; parts?: UpdrawChatPart[]; delayMs?: number }` |

### isUpdrawChatSession

Returns whether a value is an `UpdrawChatSession`, also one from another copy of the library.

```ts
isUpdrawChatSession(value: unknown): value is UpdrawChatSession
```

## Types

### UpdrawChatInput

```ts
type UpdrawChatInput =
  | string
  | { text: string; chips?: UpdrawChatBoxChip[]; images?: { mediaType: string; data?: string; url?: string }[] };
```

Chips are sent as a text part after the prompt that names their labels, `objectId`, and `selector`. Images are sent as `image` parts.

### UpdrawChatSendResult

| Property | Type | Description |
|----------|------|-------------|
| status | 'completed' \| 'stopped' \| 'step-limit' \| 'error' \| 'busy' \| 'detached' | How the prompt ended. See the table below. |
| error | unknown | Set with `'error'`: what the transport threw. |

| status | Meaning |
|--------|---------|
| `'completed'` | The model answered without more tool calls. |
| `'stopped'` | `stop()` was called. |
| `'step-limit'` | `maxSteps` was reached. |
| `'error'` | The transport threw, for example because your server failed. `error` holds the error. A tool that throws does not end the prompt: the model gets an error result and can try something else. |
| `'busy'` | Another prompt of this session, its agent, or (working as the user) the editor was running. |
| `'detached'` | The session is not bound to an editor, or its agent was removed or the workspace changed while it ran. |

### UpdrawChatTool

A tool of your app, passed in the `tools` option. Like [`UpdrawAgentTool`](./agent.md#updrawagenttool), but `run()` and `begin()` get the session's `actor` to act on the canvas with. See [Adding Your Own Tools](../advanced/agents.md#adding-your-own-tools).

```ts
interface UpdrawChatTool {
  name: string;
  description: string;
  inputSchema: UpdrawAgentToolSchema;
  /** Runs the tool with the model's input and resolves with a JSON result, e.g. from formatAgentToolResult(). */
  run: (input: unknown, context: UpdrawChatToolContext) => Promise<string>;
  /** Optional: begins a call while the model is still writing its input. */
  begin?: (context: UpdrawChatToolContext) => UpdrawAgentToolCall;
}

interface UpdrawChatToolContext {
  /** Aborted when the user stops the response. */
  signal: AbortSignal;
  /** The ID of the call, as in its tool-call part, its result, and the tool-call events. */
  toolCallId?: string;
  /** Acts on the canvas as the session: its agent, or the user. */
  actor: UpdrawChatActor;
}

interface UpdrawChatActor {
  /** 'agent' with an agent, otherwise 'user'. */
  readonly kind: 'agent' | 'user';
  /** Performs an action with the call's signal and, in agent mode, the session's instant option. */
  perform(action: UpdrawAgenticAction, options?: UpdrawAgenticActionOptions): Promise<UpdrawAgenticActionResult>;
  /** What the actor sees of the canvas, as observe_canvas returns it. */
  observe(options?: UpdrawObserveOptions): Promise<UpdrawCanvasSnapshot>;
}
```

Changes made through `actor` behave like those of the canvas tools: working as the user, they are part of the prompt's undo step, the stop button rolls them back, and with an agent they are the agent's changes.

With `begin()`, the session begins a call of a streamed answer when the model starts writing it, once every call started before it has ended. It passes the input written so far to the `update()` of the returned [`UpdrawAgentToolCall`](./agent.md#updrawagenttool) after each `tool-call-delta`, and then calls `finish()` instead of `run()` when the call runs, or `cancel()` when it won't run: its part never arrived, a `message` event left it out, or the prompt was stopped or ended early. The prompt goes on only once a promise that `cancel()` returns has resolved. With `eagerToolCalls: false`, the first call of an answer runs only once the answer has ended, so only that call is begun while the model writes. Calls of answers that are not streamed only get `run()`.

### UpdrawChatToolCallUpdate

The payload of the `tool-call` event: the progress of a tool call of a streamed answer. Calls of answers that are not streamed are not reported. While the model writes `create_iframe`, or `create_image` with a size, the canvas already shows the object as a loading placeholder.

| Property | Type | Description |
|----------|------|-------------|
| id | string | The ID of the call, as in its `tool-call` part and its result. |
| name | string | The name of the tool. |
| state | UpdrawChatToolCallState | Where the call is. See [UpdrawChatToolCallState](#updrawchattoolcallstate). |
| inputText | string | The input streamed so far as JSON text: the joined deltas. Usually incomplete before `'ready'`. |
| inputDelta | string | With `'input'`: the text that just arrived. |
| input | unknown | From `'ready'` on: the input of the `tool-call` part, an object or a JSON string. |
| result | UpdrawChatToolResultPart | With `'done'`: the result the model gets. |
| ran | boolean | With `'done'`: whether the tool ran. `false` when the prompt ended first or there is no such tool. |

### UpdrawChatToolCallState

Where a tool call of a streamed answer is. Each call ends exactly once, with `'done'` or `'discarded'`, and an ID that ended is not reported again.

| State | Meaning |
|-------|---------|
| `'started'` | The model began the call. |
| `'input'` | More of the input arrived. Reported once per `tool-call-delta`. |
| `'ready'` | The part of the call arrived, so it is complete. Reported again when a `message` event changes it. |
| `'running'` | Its tool runs. This can be while the answer still streams. |
| `'done'` | The call has its result. |
| `'discarded'` | The call is not part of the conversation and never ran: its part never arrived, a `message` event left it out, or the answer was stopped or failed before any of its calls ran. |

### UpdrawChatMessage

| Property | Type | Description |
|----------|------|-------------|
| role | 'user' \| 'assistant' \| 'tool' | `user`: the prompt. `assistant`: the model's text and tool calls. `tool`: the results of the tool calls of the assistant message before. |
| parts | UpdrawChatPart[] | The content. |
| providerData | `Record<string, unknown>` | Data of your server, sent back unchanged. |

### UpdrawChatPart

| Part | Properties |
|------|------------|
| `text` | `text: string` |
| `image` | `mediaType: string`, `data?: string` (base64 without prefix), `url?: string` |
| `tool-call` | `id: string`, `name: string`, `input: unknown` (an object or a JSON string) |
| `tool-result` | `toolCallId: string`, `name: string`, `output: string`, `isError?: boolean` |

Every part can have `providerData`. A `tool-call` without an `id` gets one.

### UpdrawChatRequest

| Property | Type | Description |
|----------|------|-------------|
| version | 1 | `UPDRAW_CHAT_PROTOCOL_VERSION`. |
| system | string | The `system` option. |
| messages | UpdrawChatMessage[] | The whole conversation. |
| tools | UpdrawChatToolDefinition[] | `name`, `description`, and `inputSchema` (JSON Schema) of each tool. |
| mode | 'agent' \| 'user' | Whether the tools act as an agent or as the user. |
| context | `Record<string, unknown>` | The `context` option. |

### UpdrawChatResponse

| Property | Type | Description |
|----------|------|-------------|
| message | UpdrawChatMessage | The model's answer. Its `role` is set to `'assistant'`. |
| stopReason | 'end' \| 'tool-calls' \| 'max-tokens' \| 'refusal' \| 'other' | Why the model stopped. Informational: the session runs the tool calls it finds. |
| version | 1 | Optional. |

### UpdrawChatStreamEvent

| Event | Description |
|-------|-------------|
| `{ type: 'text-delta', text }` | Appended to the last text part, or starts one. |
| `{ type: 'tool-call-start', id, name }` | Optional. The model began a tool call. The session reports it as a `tool-call` event and, when its tool has `begin()`, begins it once the calls started before it have ended (see [UpdrawChatTool](#updrawchattool)). A call never runs from it alone. |
| `{ type: 'tool-call-delta', id, inputDelta }` | Optional. More of the call's input as JSON text. The deltas joined are the input as written so far, which a begun call gets in `update()`. |
| `{ type: 'part', part }` | Adds a complete part, for example a tool call. A tool call with the ID of a started call completes that call; its `name` and `input` win over the start and the deltas. The call can run right away (see `eagerToolCalls`). |
| `{ type: 'message', message }` | Replaces everything streamed so far. Complete calls it leaves out are dropped unless they already started running; calls still being written wait for their part; calls it adds run once the answer has ended. |
| `{ type: 'finish', stopReason?, providerData? }` | Ends the answer. |
| `{ type: 'error', message }` | Ends the prompt with `status: 'error'` and an `Error` with `message`, like a transport that throws: the answer is dropped, or kept as far as it got when one of its calls already ran. |

Your server follows these rules:

- Close every call you start with its `part`. A started call that has no part when the answer ends is dropped, with a warning in the console.
- When the joined input is not valid JSON, for example because it was cut off, send the raw text as a string `input`. The canvas tools answer it with `'invalid-input'`, which the model can act on.
- A part is final: its call may already be running, so don't take it back later.
- A `message` event replaces everything. A call that already started running stays in the answer even when the message leaves it out, with a warning in the console. Give tool calls IDs when you send them both as parts and in a message.
- Events without an `id`, and events of other types, are ignored.
- `stopReason` is informational, as in a response.

### UpdrawChatTransport

```ts
type UpdrawChatTransport = (
  request: UpdrawChatRequest,
  options: { signal: AbortSignal },
) => Promise<UpdrawChatResponse | AsyncIterable<UpdrawChatStreamEvent>> | AsyncIterable<UpdrawChatStreamEvent>;
```

Throw to end the prompt with `status: 'error'`. The tool calls of a whole answer run once it is in. Each tool call of a streamed answer runs as soon as its part arrives, while the stream goes on (see `eagerToolCalls`), one call at a time in the order the calls started: a call whose part arrives before that of a call started earlier waits for it. A call without `tool-call-start` starts when its part arrives. When a streamed answer fails or is stopped after one of its calls ran, the answer read so far is kept with the results of its calls, so the conversation matches the canvas. Calls that did not start get an `'aborted'` result.

### UpdrawChatHttpError

Thrown by [`createHttpTransport()`](#createhttptransport) when your server answers with an error status. Extends `Error`. A prompt that ends with it has it in the `error` of its [`UpdrawChatSendResult`](#updrawchatsendresult).

| Property | Type | Description |
|----------|------|-------------|
| status | number | The HTTP status, for example `401`. |
| body | string | The body of the answer. |
| message | string | `The chat request failed with status <status>: <detail>`, where `<detail>` is the `error`, `error.message`, or `message` of a JSON body. Without one, `The chat request failed with status <status>.` |
