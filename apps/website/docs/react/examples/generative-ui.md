---
sidebar_label: Generative UI
displayed_sidebar: tutorialSidebar
title: "Generative UI Example | Kritzel for React"
description: "Connect a language model to the Kritzel chat box and let it build working, sandboxed user interfaces right on the infinite canvas."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Generative UI

This example connects a language model to the editor's built-in chat box. Describe an interface and the model writes a complete HTML document, which lands on the canvas as a working UI in a sandboxed iframe. Every UI is a regular canvas object, so it can be moved, resized and renamed, and selecting one lets you ask the model to change it.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to have a working `<KritzelEditor>` rendered in your React app. This example builds on that setup. To generate UIs with a model you need an API key from Anthropic, OpenAI or Google Gemini.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Rendering iFrames](/docs/react/advanced/dynamic-objects#rendering-iframes) — running generated HTML, CSS and JavaScript in a sandbox with `KritzelIframeObject`
- [Object Titlebar](/docs/react/fundamentals/controls#object-titlebar) — giving each UI an editable title, its size and a fullscreen button
- [Objects](/docs/react/fundamentals/objects) — adding, updating and removing UIs through the editor's methods
- [Viewport](/docs/react/fundamentals/viewport) — moving the viewport so that every new UI is in view

---

## Prompting UIs onto the Canvas

Add an API key in the welcome panel, then type into the chat box or pick one of the example prompts. A new UI appears right away with an animated placeholder, and the real interface replaces the placeholder once the model has answered. The answer arrives in one piece, not streamed. To change a UI, select it and send another prompt; with nothing selected, the next prompt adds a new UI to the right of the others. The ▶ button in a titlebar opens the UI in fullscreen.

**Keep API keys off the client in production.** The demo sends requests straight from the browser with a key that only lives in the component's memory. That is fine for trying things out with your own key, but anyone can read a key in a web page. A real app should send these requests through its own backend. All of the provider code sits behind `complete()` in `llm-providers.ts`, so that function is the one to replace.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/generative-ui"
  repoFiles={[
    'src/pages/examples/generative-ui/GenerativeUiPage.tsx',
    'src/pages/examples/generative-ui/generative-ui.ts',
    'src/pages/examples/generative-ui/llm-providers.ts',
    'src/pages/examples/generative-ui/WelcomePanel.tsx',
    'src/pages/examples/generative-ui/UiPreview.tsx',
  ]}
/>

### Connecting the chat box

The `isChatBoxVisible` prop shows the chat box and `isChatBoxLoading` switches it to its busy state. `onChatSubmit` delivers the prompt in `event.detail`, and `onChatStop` fires when the user stops a running request, which the page forwards to an `AbortController`.

```tsx
<KritzelEditor
  ref={editorRef}
  editorId="generative-ui"
  workspaces={workspaces}
  objectConfig={objectConfig}
  objectTitlebar={objectTitlebar}
  isChatBoxVisible
  isChatBoxLoading={isWorking}
  onIsReady={onReady}
  onChatSubmit={(event) => void generate(event.detail)}
  onChatStop={() => abortRef.current?.abort()}
  onObjectsChange={(event) => setHasUis(event.detail.some(isUi))}
  onObjectTitlebarAction={(event) => void onTitlebarAction(event.detail)}
/>
```

The generator itself is plain TypeScript. `onIsReady` hands it the editor element, and it only uses the editor's public methods.

### Adding a UI

A new UI is a `KritzelIframeObject` that starts out loading, so `loadingContent` is shown until the model answers. The `allow-scripts` sandbox lets the generated JavaScript run while keeping it away from the host page. The page is laid out at 800 × 600 CSS pixels and drawn slightly smaller through `scale`, like a frame in a design tool.

```ts
const ui = await this.editor.addObject(
  new KritzelIframeObject({
    name,
    title: name,
    loadingContent: UI_SKELETON,
    isLoading: true,
    sandbox: ["allow-scripts"],
    translateX: x,
    translateY: y,
    width: UI_WIDTH,
    height: UI_HEIGHT,
    scale: UI_SCALE,
    borderRadius: 12,
  }),
);
```

### Applying the answer

The system prompt asks the model for one self-contained HTML document, and tells it about the frame's size and sandbox limits. `parseUiDocument()` splits the answer into the `html` and `css` of the iframe's content and takes the frame's title from the document's `<title>`.

```ts
const answer = await complete({ system: SYSTEM_PROMPT, prompt: request, signal });
const { title, content } = parseUiDocument(answer, getUiTitle(ui));
// Look the UI up again: the instance in the store can be replaced in the meantime, e.g. by undo.
const current = await this.getUi(ui.id);
if (!current) {
  return;
}
current.setContent(content);
current.setLoading(false);
if (!existing) {
  await this.editor.updateObject(current, { name: title, title });
}
```

When exactly one UI is selected, the request includes its current document and the model returns a full replacement, so the same code handles both new UIs and changes. If a request fails or is stopped, a new UI is removed from the canvas again, while an existing UI keeps its content.

### Titlebars and fullscreen

`objectConfig` gives only the UIs a titlebar and keeps them from rotating. `objectTitlebar` describes its contents: an editable title and the current size on the left, and a play button on the right.

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

Pressing the button fires `onObjectTitlebarAction` with the button's `elementId` and the `objectId`. The page rebuilds a standalone document from the UI's content with `createUiDocument()` and shows it in the fullscreen preview.

```tsx
async function onTitlebarAction({ elementId, objectId }: KritzelObjectTitlebarActionEvent) {
  const ui = await editorRef.current?.getObjectById(objectId);
  if (elementId === "play" && ui && isUi(ui) && !ui.isLoading) {
    setPreview({ title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) });
  }
}
```
