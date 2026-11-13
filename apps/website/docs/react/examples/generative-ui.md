---
sidebar_label: Generative UI
displayed_sidebar: tutorialSidebar
title: "Generative UI Example | Kritzel for React"
description: "Bind a chat session with the iframe canvas tools to the chat box and let a language model build working, sandboxed user interfaces on the infinite canvas."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Generative UI

This example lets a language model build user interfaces on the canvas. Describe an interface in the chat box, and the model places it with the `create_iframe` canvas tool: a widget of HTML, CSS, and JavaScript that runs in a sandboxed iframe without network access. Select a widget to ask for a change, and the model reads and edits its code with `read_iframe` and `update_iframe`.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to have a working `<KritzelEditor>` rendered in your React app. This example builds on that setup. To generate UIs with a model, you need an API key from Anthropic, OpenAI, or Google Gemini. Without one, the demo answers the example prompts with canned UIs.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Agents](/docs/react/advanced/agents) - connecting the chat box to a model with `KritzelChatSession`, its canvas tools, and transports
- [Rendering iFrames](/docs/react/advanced/dynamic-objects#rendering-iframes) - how iframe objects run generated HTML, CSS, and JavaScript in a sandbox
- [Object Titlebar](/docs/react/fundamentals/controls#object-titlebar) - giving each UI an editable title, its size, and a fullscreen button

---

## Prompting UIs onto the Canvas

Choose whether to use your own API key or mocked requests, then type into the chat box or pick one of the example prompts. The UI appears as a placeholder as soon as the model has written its position and size, and its interface replaces the placeholder once the model has written the code. To change a UI, select it: it shows as a chip above the chat box, and the next prompt is about it. The ▶ button in a titlebar opens the UI in fullscreen.

**Keep API keys off the client in production.** With your own key, the demo calls the provider straight from the browser, and the key only lives in the component's memory. That is fine for trying things out, but anyone can read a key in a web page. A real app sends the requests through [its own server](../advanced/agents.md#your-server) with `createHttpTransport()` instead, and only the transport changes.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/generative-ui"
  repoFiles={[
    'src/pages/examples/generative-ui/GenerativeUiPage.tsx',
    'src/pages/examples/generative-ui/generative-ui.ts',
    'src/pages/examples/generative-ui/browser-transport.ts',
    'src/pages/examples/generative-ui/mock-transport.ts',
    'src/pages/examples/generative-ui/WelcomePanel.tsx',
    'src/pages/examples/generative-ui/UiPreview.tsx',
  ]}
/>

### Creating the session

The session runs the tool loop: it sends the conversation through its transport, runs the tool calls of the answer on the canvas, and sends the results back until the model is done. `canvasTools: { iframes: true }` adds `create_iframe`, `read_iframe`, and `update_iframe` to the canvas tools. The system prompt tells the model where to place new UIs, how to build them, and to change an existing UI instead of adding a new one.

```ts
export function createGenerativeUiSession(transport: KritzelChatTransport): KritzelChatSession {
  return new KritzelChatSession({ transport, system: SYSTEM_PROMPT, canvasTools: { iframes: true } });
}
```

The page creates one session per mode, once, and binds the one of the chosen mode:

```tsx
const [{ browser, sessions }] = useState(() => {
  const browser = createBrowserTransport();
  return {
    browser,
    sessions: { live: createGenerativeUiSession(browser.transport), mock: createGenerativeUiSession(createMockTransport()) },
  };
});
const session = mode ? sessions[mode] : null;
```

### Connecting the chat box

`chatSession` binds the session to the chat box: the chat box sends its prompts to the session, shows its progress, and its stop button stops it. `chatBoxChips` shows the selected UIs as chips, and the session tells the model which objects they refer to.

```tsx
<KritzelEditor
  ref={editorRef}
  editorId="generative-ui"
  themes={themes}
  workspaces={workspaces}
  objectConfig={objectConfig}
  objectTitlebar={objectTitlebar}
  chatSession={session}
  chatBoxChips={chips}
  isChatBoxVisible={mode === "mock" || credentials !== null}
  onObjectsSelectionChange={(event) => setChips(getUiChips(event.detail))}
  onChatChipRemove={(event) => setChips((current) => current.filter((chip) => chip.id !== event.detail.id))}
  onObjectTitlebarAction={(event) => void onTitlebarAction(event.detail)}
/>
```

The chat box shows that a prompt is running, but not why it failed, for example because the provider rejected the key. The page listens to the session's `end` event and shows the error as a notification:

```tsx
useEffect(
  () =>
    session?.on("end", (result) => {
      if (result.status === "error") {
        void editorRef.current?.triggerNotification({ type: "error", message: getErrorMessage(result.error) });
      }
    }),
  [session],
);
```

### Calling the model from the browser

A transport is a function that takes the request of one model step and returns the answer. With your own key, `createBrowserTransport()` returns one that calls Anthropic, OpenAI, or Gemini straight from the browser. For each step, it translates Kritzel's chat protocol into the provider's API, and translates the provider's stream back into [stream events](../api-reference/chat-session.md#kritzelchatstreamevent), so that the session runs each tool call as soon as the model has written it.

```ts
transport: (request, { signal }) => {
  if (!credentials) {
    throw new Error("Add an API key to start generating UIs.");
  }
  const provider = getProvider(credentials.provider);
  switch (provider.id) {
    case "anthropic":
      return streamAnthropic(provider, credentials.apiKey, request, signal);
    case "openai":
      return streamOpenAi(provider, credentials.apiKey, request, signal);
    case "gemini":
      return streamGemini(provider, credentials.apiKey, request, signal);
  }
},
```

Anthropic and Gemini need parts of their answers back on the next request, such as Claude's thinking blocks and Gemini's thought signatures. The transport puts them in `providerData`, on the `finish` event and on Gemini's tool calls, and the session sends them back unchanged. Rate limits and server errors are tried again, and an answer that ends abnormally, for example because the provider refused it or the stream broke off, ends the prompt with an error that the page shows as a notification.

### Trying it without a key

Without a key, the demo uses `createScriptedTransport()`, which answers from a script instead of a model. Every prompt is answered with a `create_iframe` call for one of the canned UIs, followed by `fit_viewport`. With `stream`, the answer streams like a model writes it, so the UI shows as a placeholder until its code is written.

```ts
return createScriptedTransport(
  (request): string | KritzelScriptedAnswer => {
    // ...
    return {
      text: `Building the ${name}.`,
      toolCalls: [
        { tool: "create_iframe", input: { name, x, y, width: MOCK_WIDTH, height: MOCK_HEIGHT, html, css, script } },
        { tool: "fit_viewport", input: {} },
      ],
    };
  },
  { delayMs: 400, stream: { chunkSize: 40, chunkDelayMs: 12 } },
);
```

### Titlebars and fullscreen

`objectConfig` gives only the UIs a titlebar and keeps them from rotating. `objectTitlebar` describes its contents: an editable title and the current size on the left, and a play button on the right. The themes give the UIs rounded corners and a soft shadow through their [`iframe`](../api-reference/theming.md#iframe) variables.

```ts
export const objectConfig: KritzelObjectConfig = {
  hasTitlebar: (object) => isUi(object),
  isRotatable: false,
};

export const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [
    { id: "title", type: "title", isEditable: true },
    {
      id: "size",
      type: "text",
      tone: "muted",
      minBarWidth: 180,
      text: ({ contentSize }) => `${Math.round(contentSize.width)} × ${Math.round(contentSize.height)}`,
    },
  ],
  right: [{ id: "play", type: "button", icon: "play", tooltip: "Open fullscreen" }],
};
```

Pressing the button fires `onObjectTitlebarAction` with the button's `elementId` and the `objectId`. The page builds a standalone document from the UI's content with `createUiDocument()`, which keeps the content security policy of model-written code, and shows it in the fullscreen preview.

```tsx
async function onTitlebarAction({ elementId, objectId }: KritzelObjectTitlebarActionEvent) {
  const ui = await editorRef.current?.getObjectById(objectId);
  if (elementId === "play" && ui && isUi(ui) && !ui.isLoading) {
    setPreview({ title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) });
  }
}
```
