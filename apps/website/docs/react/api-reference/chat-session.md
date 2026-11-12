---
sidebar_label: Chat Session
displayed_sidebar: tutorialSidebar
title: "Chat Session API Reference | Kritzel for React"
description: "API reference for KritzelChatSession: options, properties, methods, events, the chat protocol types, createHttpTransport, and createScriptedTransport."
toc_max_heading_level: 2
---

# Chat Session

`KritzelChatSession` connects the chat box to an LLM through your server. It runs the tool loop in the browser: it sends the conversation through a transport, runs the tool calls of the answer on the canvas, and sends the results back until the model is done. Bind it to the editor with the `chatSession` prop:

```ts
import { createHttpTransport, KritzelChatSession } from '@kritzel/react-editor';

const session = new KritzelChatSession({ transport: createHttpTransport('/api/chat') });
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
| tools | KritzelAgentTool[] | `[]` | Your own tools, added to the canvas tools. A name that clashes with a canvas tool ends the prompt with `status: 'error'`. |
| maxSteps | number | `25` | Most model steps per prompt. |
| messages | KritzelChatMessage[] | `[]` | A conversation to continue. Tool calls without a result get an `'aborted'` result. |
| instant | boolean | `false` | Agent mode: skips the cursor animation. Working as the user is always instant. |
| thinkingStatus | string \| false | `'Thinking…'` | Agent mode: the agent's status while the model thinks. `false` keeps the status. |

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

Stops the running prompt: the transport's `signal` aborts, the running action is rolled back, and the remaining tool calls get an `'aborted'` result. Changes of earlier actions are kept.

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
| end | KritzelChatSendResult | A prompt ended. |

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
createHttpTransport(urlOrOptions: string | URL | KritzelHttpTransportOptions): KritzelChatTransport
```

Throws a `TypeError` without a URL.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string \| URL | — | Required. The endpoint of your server, for example `'/api/chat'`. |
| headers | `HeadersInit \| (request: KritzelChatRequest) => HeadersInit \| Promise<HeadersInit>` | — | Headers sent with every request, for example `Authorization`. A function is called for each request. |
| credentials | RequestCredentials | — | Whether cookies are sent, as in `fetch()`. |
| fetch | typeof fetch | global `fetch` | The `fetch` to use, for example in tests. |

The request has the headers `Content-Type: application/json` and `Accept: application/x-ndjson, text/event-stream, application/json`, unless `headers` sets them. The `Content-Type` of the answer decides how it is read:

| Content-Type | Answer |
|--------------|--------|
| `application/x-ndjson` (or another type containing `ndjson` or `jsonl`) | One `KritzelChatStreamEvent` as JSON per line. Blank lines are skipped. |
| `text/event-stream` | Server-sent events. The `data` of each event without an `event` field, or with `event: message`, is one `KritzelChatStreamEvent` as JSON. Other events, comments, and `data: [DONE]` are skipped. |
| anything else | One `KritzelChatResponse` as JSON. |

An answer with an error status throws a [`KritzelChatHttpError`](#kritzelchathttperror). Invalid JSON throws an `Error`. Both end the prompt with `status: 'error'`. Stopping the session aborts the request.

### createScriptedTransport

Returns a transport that answers from a script instead of a model, for demos and tests. The steps answer the model steps in order, across prompts; once they run out, the last step answers. With a function, the script decides per request. The delay rejects with an `AbortError` when the request is aborted.

```ts
createScriptedTransport(
  steps: KritzelScriptedStep[] | ((request: KritzelChatRequest, index: number) => string | KritzelScriptedAnswer),
  options?: { delayMs?: number },
): KritzelChatTransport
```

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
| `{ type: 'part', part }` | Adds a complete part, for example a tool call. |
| `{ type: 'message', message }` | Replaces everything streamed so far. |
| `{ type: 'finish', stopReason?, providerData? }` | Ends the answer. |
| `{ type: 'error', message }` | Ends the prompt with `status: 'error'` and an `Error` with `message`. What was streamed is dropped. |

### KritzelChatTransport

```ts
type KritzelChatTransport = (
  request: KritzelChatRequest,
  options: { signal: AbortSignal },
) => Promise<KritzelChatResponse | AsyncIterable<KritzelChatStreamEvent>> | AsyncIterable<KritzelChatStreamEvent>;
```

Throw to end the prompt with `status: 'error'`. Version 1 collects a stream before running the tools.

### KritzelChatHttpError

Thrown by [`createHttpTransport()`](#createhttptransport) when your server answers with an error status. Extends `Error`. A prompt that ends with it has it in the `error` of its [`KritzelChatSendResult`](#kritzelchatsendresult).

| Property | Type | Description |
|----------|------|-------------|
| status | number | The HTTP status, for example `401`. |
| body | string | The body of the answer. |
| message | string | `The chat request failed with status <status>: <detail>`, where `<detail>` is the `error`, `error.message`, or `message` of a JSON body. Without one, `The chat request failed with status <status>.` |
