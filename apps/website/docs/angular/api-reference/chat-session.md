---
sidebar_label: Chat Session
displayed_sidebar: tutorialSidebar
title: "Chat Session API Reference | Kritzel for Angular"
description: "API reference for KritzelChatSession: options, properties, methods, events, the chat protocol types, and createScriptedTransport."
toc_max_heading_level: 2
---

# Chat Session

`KritzelChatSession` connects the chat box to an LLM through your server. It runs the tool loop in the browser: it sends the conversation through a transport, runs the tool calls of the answer on the canvas, and sends the results back until the model is done. Bind it to the editor with the `chatSession` prop:

```ts
import { KritzelChatSession } from '@kritzel/angular-editor';

const session = new KritzelChatSession({ transport: chatTransport });
```

For a guided introduction, see [Chat Sessions](../advanced/chat-sessions.md). The `chatSession` prop is listed in the [Editor API Reference](./editor.md#ui-elements).

## Constructor

```ts
new KritzelChatSession(options: KritzelChatSessionOptions)
```

Throws a `TypeError` when `transport` is not a function or `maxSteps` is not a positive integer.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| transport | KritzelChatTransport | — | Required. Sends one step of the conversation to your server. See [KritzelChatTransport](#kritzelchattransport). |
| agent | KritzelAgent | — | The agent the model acts as. Without one, the model works as the user. The editor adds the agent when the session is bound. |
| system | string | — | Instructions sent with every request. |
| context | `Record<string, unknown> \| () => Record<string, unknown> \| undefined` | — | App data sent with every request. A function is called for each request. |
| tools | KritzelAgentTool[] | `[]` | Your own tools, added to the canvas tools. A name that clashes with a canvas tool ends the prompt with `status: 'error'`. `run()` gets the `toolCallId` of the call in its context. |
| maxSteps | number | `25` | Most model steps per prompt. |
| messages | KritzelChatMessage[] | `[]` | A conversation to continue. Tool calls without a result get an `'aborted'` result. |
| instant | boolean | `false` | Agent mode: skips the cursor animation. Working as the user is always instant. |
| thinkingStatus | string \| false | `'Thinking…'` | Agent mode: the agent's status while the model thinks. `false` keeps the status. |
| eagerToolCalls | boolean | `true` | Streamed answers: runs each tool call as soon as its part arrives, while the model still writes the rest of the answer. `false` runs the calls once the answer has ended, like those of answers that are not streamed, for example for a server whose model can take back calls it already sent. See [Streaming](../advanced/chat-sessions.md#streaming). |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| messages | readonly KritzelChatMessage[] | The conversation so far. A new array after every change. |
| running | boolean | Whether a prompt is running. |
| mode | 'agent' \| 'user' | `'agent'` with an agent, otherwise `'user'`. |
| agent | KritzelAgent \| null | The agent the model acts as. |
| isAttached | boolean | Whether the session is bound to an editor. |
| tools | KritzelAgentTool[] | The tools the model gets: the canvas tools of the mode plus your own. |

## Methods

### send

Sends a prompt and runs the tool loop until the model answers without tool calls. Never rejects; the result tells how the prompt ended. Throws a `TypeError` for an empty prompt.

```ts
send(input: KritzelChatInput): Promise<KritzelChatSendResult>
```

Working as the user, all changes of one prompt become one step of the user's history.

### stop

Stops the running prompt: the transport's `signal` aborts, the running action is rolled back, and the remaining tool calls get an `'aborted'` result. Changes of earlier actions are kept. A streamed answer that is stopped after one of its tool calls ran is kept as far as it got, with the results of its calls; otherwise it is dropped.

```ts
stop(): void
```

### on

Subscribes to an event. Returns a function that unsubscribes.

```ts
on<K extends keyof KritzelChatSessionEventMap>(event: K, listener: (payload: KritzelChatSessionEventMap[K]) => void): () => void
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
| message | KritzelChatMessage | A message was added. |
| tool-call | KritzelChatToolCallUpdate | A tool call of a streamed answer made progress: once per input delta while the model writes it, and before the answer is in `messages`. Throttle what you render from it. See [KritzelChatToolCallUpdate](#kritzelchattoolcallupdate). |
| end | KritzelChatSendResult | A prompt ended. |

## Binding

The editor binds the session given in `chatSession` and unbinds it when the editor is removed from the page. A session that is replaced finishes its running prompt first. A session belongs to one editor at a time. While the session is bound:

- The chat box sends its prompts to the session, with `chatBoxChips` as chips, unless a `chatSubmit` listener calls `preventDefault()`.
- The chat box shows its progress while the session runs, and its stop button calls `stop()`.
- Working as the user, one session runs at a time in the editor. With an agent, one session runs at a time per agent. Others resolve with `status: 'busy'`.
- A running prompt ends with `status: 'detached'` when the session is unbound, its agent is removed, or the workspace changes.

## Functions

### createScriptedTransport

Returns a transport that answers from a script instead of a model, for demos and tests. The steps answer the model steps in order, across prompts; once they run out, the last step answers. With a function, the script decides per request. The delays reject with an `AbortError` when the request is aborted.

```ts
createScriptedTransport(
  steps: KritzelScriptedStep[] | ((request: KritzelChatRequest, index: number) => string | KritzelScriptedAnswer),
  options?: KritzelScriptedTransportOptions,
): KritzelChatTransport
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| delayMs | number | `0` | How long each answer takes, like a model thinking. The `delayMs` of an answer overrides it. |
| stream | `boolean \| { chunkSize?: number; chunkDelayMs?: number }` | `false` | Streams each answer like a model: its text as `text-delta` chunks, each tool call as `tool-call-start`, the JSON of its input as `tool-call-delta` chunks, and its `part`, then the extra `parts` and `finish`. The messages are the same as without streaming. `chunkSize` is in characters (default `16`), `chunkDelayMs` is the wait before each chunk (default `0`). |

| Type | Description |
|------|-------------|
| KritzelScriptedStep | `string` (a text answer), `KritzelScriptedAnswer`, or `(request, index) => string \| KritzelScriptedAnswer`. |
| KritzelScriptedAnswer | `{ text?: string; toolCalls?: { tool: string; input?: object; id?: string }[]; parts?: KritzelChatPart[]; delayMs?: number }` |

### isKritzelChatSession

Returns whether a value is a `KritzelChatSession`, also one from another copy of the library.

```ts
isKritzelChatSession(value: unknown): value is KritzelChatSession
```

## Types

### KritzelChatInput

```ts
type KritzelChatInput =
  | string
  | { text: string; chips?: KritzelChatBoxChip[]; images?: { mediaType: string; data?: string; url?: string }[] };
```

Chips are sent as a text part after the prompt that names their labels, `objectId`, and `selector`. Images are sent as `image` parts.

### KritzelChatSendResult

| Property | Type | Description |
|----------|------|-------------|
| status | 'completed' \| 'stopped' \| 'step-limit' \| 'error' \| 'busy' \| 'detached' | How the prompt ended. See [Stopping and Results](../advanced/chat-sessions.md#stopping-and-results). |
| error | unknown | Set with `'error'`: what the transport threw. |

### KritzelChatToolCallUpdate

The payload of the `tool-call` event: the progress of a tool call of a streamed answer. Calls of answers that are not streamed are not reported. See [Showing Tool Calls as They Stream](../advanced/chat-sessions.md#showing-tool-calls-as-they-stream).

| Property | Type | Description |
|----------|------|-------------|
| id | string | The ID of the call, as in its `tool-call` part and its result. |
| name | string | The name of the tool. |
| state | KritzelChatToolCallState | Where the call is. See [KritzelChatToolCallState](#kritzelchattoolcallstate). |
| inputText | string | The input streamed so far as JSON text: the joined deltas. Usually incomplete before `'ready'`. |
| inputDelta | string | With `'input'`: the text that just arrived. |
| input | unknown | From `'ready'` on: the input of the `tool-call` part, an object or a JSON string. |
| result | KritzelChatToolResultPart | With `'done'`: the result the model gets. |
| ran | boolean | With `'done'`: whether the tool ran. `false` when the prompt ended first or there is no such tool. |

### KritzelChatToolCallState

Where a tool call of a streamed answer is. Each call ends exactly once, with `'done'` or `'discarded'`.

| State | Meaning |
|-------|---------|
| `'started'` | The model began the call. |
| `'input'` | More of the input arrived. Reported once per `tool-call-delta`. |
| `'ready'` | The part of the call arrived, so it is complete. Reported again when a `message` event changes it. |
| `'running'` | Its tool runs. This can be while the answer still streams. |
| `'done'` | The call has its result. |
| `'discarded'` | The call is not part of the conversation and never ran: its part never arrived, or a `message` event left it out. |

### KritzelChatMessage

| Property | Type | Description |
|----------|------|-------------|
| role | 'user' \| 'assistant' \| 'tool' | `user`: the prompt. `assistant`: the model's text and tool calls. `tool`: the results of the tool calls of the assistant message before. |
| parts | KritzelChatPart[] | The content. |
| providerData | `Record<string, unknown>` | Data of your server, sent back unchanged. |

### KritzelChatPart

| Part | Properties |
|------|------------|
| `text` | `text: string` |
| `image` | `mediaType: string`, `data?: string` (base64 without prefix), `url?: string` |
| `tool-call` | `id: string`, `name: string`, `input: unknown` (an object or a JSON string) |
| `tool-result` | `toolCallId: string`, `name: string`, `output: string`, `isError?: boolean` |

Every part can have `providerData`. A `tool-call` without an `id` gets one.

### KritzelChatRequest

| Property | Type | Description |
|----------|------|-------------|
| version | 1 | `KRITZEL_CHAT_PROTOCOL_VERSION`. |
| system | string | The `system` option. |
| messages | KritzelChatMessage[] | The whole conversation. |
| tools | KritzelChatToolDefinition[] | `name`, `description`, and `inputSchema` (JSON Schema) of each tool. |
| mode | 'agent' \| 'user' | Whether the tools act as an agent or as the user. |
| context | `Record<string, unknown>` | The `context` option. |

### KritzelChatResponse

| Property | Type | Description |
|----------|------|-------------|
| message | KritzelChatMessage | The model's answer. Its `role` is set to `'assistant'`. |
| stopReason | 'end' \| 'tool-calls' \| 'max-tokens' \| 'refusal' \| 'other' | Why the model stopped. Informational: the session runs the tool calls it finds. |
| version | 1 | Optional. |

### KritzelChatStreamEvent

| Event | Description |
|-------|-------------|
| `{ type: 'text-delta', text }` | Appended to the last text part, or starts one. |
| `{ type: 'tool-call-start', id, name }` | Optional. The model began a tool call. The session reports it as a `tool-call` event; a call never runs from it alone. |
| `{ type: 'tool-call-delta', id, inputDelta }` | Optional. More of the call's input as JSON text. The deltas joined are the input as written so far. |
| `{ type: 'part', part }` | Adds a complete part, for example a tool call. A tool call with the ID of a started call completes that call; its `name` and `input` win over the start and the deltas. The call can run right away (see `eagerToolCalls`). |
| `{ type: 'message', message }` | Replaces everything streamed so far. Calls it leaves out are dropped unless they already started running; calls it adds run once the answer has ended. |
| `{ type: 'finish', stopReason?, providerData? }` | Ends the answer. |

Your server follows these rules:

- Close every call you start with its `part`. A started call that has no part when the answer ends is dropped, with a warning in the console.
- When the joined input is not valid JSON, for example because it was cut off, send the raw text as a string `input`. The canvas tools answer it with `'invalid-input'`, which the model can act on.
- A part is final: its call may already be running, so don't take it back later.
- A `message` event replaces everything. A call that already started running stays in the answer even when the message leaves it out, with a warning in the console. Give tool calls IDs when you send them both as parts and in a message.
- Events without an `id`, and events of other types, are ignored.
- `stopReason` is informational, as in a response.

### KritzelChatTransport

```ts
type KritzelChatTransport = (
  request: KritzelChatRequest,
  options: { signal: AbortSignal },
) => Promise<KritzelChatResponse | AsyncIterable<KritzelChatStreamEvent>> | AsyncIterable<KritzelChatStreamEvent>;
```

Throw to end the prompt with `status: 'error'`. The tool calls of a whole answer run once it is in. Each tool call of a streamed answer runs as soon as its part arrives, while the stream goes on (see `eagerToolCalls`), one call at a time in the order of the parts. When a streamed answer fails or is stopped after one of its calls ran, the answer read so far is kept with the results of its calls, so the conversation matches the canvas. Calls that did not start get an `'aborted'` result.
