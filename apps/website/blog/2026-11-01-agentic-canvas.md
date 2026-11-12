---
title: "What Is an Agentic Canvas? And How to Build One"
description: "Agentic canvases let AI agents work alongside people on an infinite canvas. Learn what they are, who builds them, and how to create your own with Kritzel."
date: 2026-11-01
thumbnail: /videos/2026_11_04_Agentic_Canvas.mp4
thumbnailSeed: "e5315435"
image: /img/blog/what-is-an-agentic-canvas.png
---

import BlogVideo from '@site/src/components/BlogVideo';

In this article we cover what an agentic canvas is and give you a short overview how you can build one using the Kritzel library.

## From chat window to canvas.

Over the last couple of years the interaction with LLMs has undergone a paradigm shift from single chats to multi agent nonlinear workflows. While the chat window has proved to be the right tool for linear conversations AI companies more recently include spatial whiteboards specifically designed for visually related tasks such as brainstorming or prototyping.

{/* truncate */}

Those canvases are the natural fit for parallel agentic work, as they allow multiple users, or in this case agents, to iterate over different parts of the same shared space. The canvas in this case becomes a room that allows humans and agents to interact with each other asynchronously, meaning that tasks can progress and finish at their own speed instead of being bound to a linear flow like in a conversation.

## What makes a canvas “agentic”?

Very similar to how a regular infinite canvas provides humans with the tools to view and interact with the canvas, an agentic canvas provides that same capabilities, but to agents instead. Hence, on an agentic canvas the agent can perform all the same task a human would but in order for a human to better follow the agents work usually agents different states are visually highlighted.

## Who’s already building them.

As mentioned earlier, quite a lot of companies have already integrated agentic canvas experiences into their products. Some of the most prominent players certainly are Miro, Figma and Framer, but also Anthropic's Design tool relies on an infinite canvas with agentic capabilities.
Those companies either have extended their closed source, internally developed canvas solutions with agentic capabilities on their own or rely on external propiertary providers such as tldraw to bring in agentic behaviour.

## What an agentic canvas is made of.

An agentic canvas usually consists of a DOM based canvas at its core that renders objects as plain html elements. That DOM based nature gives it one of it's most powerful features, namely to add not only paths and shapes but rich HTML content such as forms, videos or even entire web apps.
Those canvases usually come with agentic utility components such as cursors, a chatbox and configurable object titlebars, that makes it easy to hook up an LLM and give it full control over the canvas space.
Often the API provided by such canvases is declaratively configurable and can easily be used to adjust the canvas state by simply manipulating JSON objects. This allows not only humans but also agents to easily interact with the canvas in a programmatic way.

## Building one with Kritzel.

While it is feasible to start building an agentic canvas from scratch on your own, using a library that is specifically designed for this and takes out the tedious part of building a solid DOM based rendering engine, gives your development a jumpstart.

In the following sections we are going to use the Kritzel library to quickly setup an agentic canvas and run through its two most common use cases. This is intended to only give a rough overview and both parts of the setup are covered in more detail in dedicated blog posts.

This guide assumes you are using React as the framework of your choice. But since Kritzel is framework agnostic, the same concepts apply to Angular and Vue as well.

To get started, you first have to install the Kritzel library. Since we want to use ready made UI components such as the chatbox, we install the React editor package.

```bash
npm install @kritzel/react-editor
```

Since the underlying basis of an agentic canvas is an infinite canvas, we are first going to configure a simple editor setup, that we extend step by step with agentic capabilities.

Lets go ahead and integrate the `<KritzelEditor>` component in our app and make it fill the entire viewport.

```typescript
import { KritzelEditor } from '@kritzel/react-editor';

export function Editor() {
  return <KritzelEditor style={{ display: 'block', width: '100%', height: '100vh' }} />;
}
```

This provides us with a default editor, but simply renders a tool panel at the bottom of the editor. To replace the tools with a chatbox, we simply set `isChatBoxVisible` on the editor to true.

While the editor now already very much looks like an agentic canvas, typing any commands in the chatbox does nothing. For this to work we need to hookup a new `KritzelChatSession` as depicted below.

```typescript
const [session] = useState(
  () =>
    new KritzelChatSession({
      transport: chatTransport,
      system: SYSTEM_PROMPT,
      canvasTools: { iframes: true },
    }),
);
```

### Generative UI

Since Kritzel renders its objects as DOM, a model can write HTML, CSS and JavaScript, and a `KritzelIframeObject` runs it in a sandboxed iframe right on the canvas. We don't have to build any of that plumbing ourselves: a `KritzelChatSession` connects the editor's chat box to a model, gives the model tools to look at and change the canvas, and runs them in the browser. Our server only holds the API key and forwards each step of the conversation to the model.

```bash
npm install @kritzel/react-editor
```

The session talks to the server through a transport. This one posts each step to `/api/chat` and reads the answer while the server streams it, one event per line:

```ts title="chat-transport.ts"
import type {
  KritzelChatStreamEvent,
  KritzelChatTransport,
} from "@kritzel/react-editor";

export const chatTransport: KritzelChatTransport = async function* (
  request,
  { signal },
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`The chat request failed with status ${response.status}.`);
  }

  // Every line the server sends is one KritzelChatStreamEvent as JSON.
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line) as KritzelChatStreamEvent;
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer) as KritzelChatStreamEvent;
};
```

The editor itself only needs the session:

```tsx title="GenerativeUi.tsx"
import { useState } from "react";
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelChatSession,
  KritzelEditor,
  KritzelIframeObject,
  type KritzelObjectConfig,
} from "@kritzel/react-editor";
import { chatTransport } from "./chat-transport";

const SYSTEM_PROMPT =
  "You work on a whiteboard. Look at the canvas before you change it. Build anything interactive, " +
  "such as a calculator, a timer or a chart, as a widget with create_iframe.";

// Widgets get a titlebar with their name, to grab and move them by.
const objectConfig: KritzelObjectConfig = {
  hasTitlebar: (object) => object instanceof KritzelIframeObject,
};

export function GenerativeUi() {
  const [session] = useState(
    () =>
      new KritzelChatSession({
        transport: chatTransport,
        system: SYSTEM_PROMPT,
        canvasTools: { iframes: true },
      }),
  );

  return (
    <KritzelEditor
      chatSession={session}
      isChatBoxVisible
      objectConfig={objectConfig}
      objectTitlebar={KRITZEL_DEFAULT_OBJECT_TITLEBAR}
      style={{ display: "block", width: "100%", height: "100vh" }}
    />
  );
}
```

That is the whole client. The chat box sends its prompts to the session, shows its progress, and its stop button stops it. For each prompt, the session runs the tool loop: the model looks at the canvas with `observe_canvas`, places widgets with `create_iframe` (which `canvasTools: { iframes: true }` turns on), and can read and change them later with `read_iframe` and `update_iframe`. It works as the user, so its changes land in the user's history and one `Ctrl+Z` takes back a whole prompt.

Because the answer streams, a widget appears as a loading placeholder as soon as the model has written its position and size, and fills in once the model has written its code. Generated scripts run inside the iframe's sandbox without network access, so you can ask for a small game or a calculator and play with it right away. The model can use widgets too: ask it to “work out 12 × 7 on the calculator”, and it finds the buttons with `inspect_elements` and presses them with `interact_with_element`.

On the server, `/api/chat` receives each step in Kritzel's chat protocol, calls the model of your choice, and streams its answer back as `KritzelChatStreamEvent`s, one JSON object per line. The [Chat Sessions guide](/docs/react/advanced/chat-sessions#your-server) has a ready-made handler for Claude and explains how to [stream tool calls](/docs/react/advanced/chat-sessions#streaming-tool-calls-from-your-server) for Claude, OpenAI and Gemini. The API key never leaves the server.

The full [Generative UI example](/docs/react/examples/generative-ui) in the docs goes further, with a fullscreen preview and follow-up prompts that change a selected UI.

<BlogVideo src="/videos/2026_11_04_Agentic_Canvas_Generative_UI.mp4" label="An agent generating UI on the Kritzel canvas" />

### Agentic Cursors

So far the model works as the user: its changes appear at once and land in the user's own history. That suits an assistant that does what it is told right away. For longer tasks, people want to watch the agent work and keep working next to it. For that, Kritzel gives the agent a body of its own: a cursor with a name, a color and a status.

All it takes is a `KritzelAgent` for the session from the previous section:

```tsx title="AgenticCursors.tsx"
import { useState } from "react";
import {
  KritzelAgent,
  KritzelChatSession,
  KritzelEditor,
} from "@kritzel/react-editor";
import { chatTransport } from "./chat-transport";

export function AgenticCursors() {
  const [session] = useState(
    () =>
      new KritzelChatSession({
        transport: chatTransport,
        system:
          "You work on a whiteboard next to the user. Look at the canvas before you change it.",
        canvasTools: { iframes: true },
        // highlight-next-line
        agent: new KritzelAgent({ name: "Assistant", color: "#7C3AED" }),
      }),
  );

  return (
    <KritzelEditor
      chatSession={session}
      isChatBoxVisible
      style={{ display: "block", width: "100%", height: "100vh" }}
    />
  );
}
```

The editor adds the agent when the session is bound, and from then on the model works through its cursor. It shows “Thinking…” while the model thinks, then flies to each target and does the work the way a person would: it drags out shapes, types text, draws connectors, places widgets and presses their buttons.

The agent has its own selection and its own undo history, so the user's `Ctrl+Z` never takes back the agent's work, and the other way round. It also never takes an object out of someone's hands. When the user is working on an object, the agent's action is refused with a reason the model can read, and it leaves that object alone. With multiplayer sync turned on, collaborators see the agent's cursor too.

The cursor is not tied to an LLM. Any agent can be driven from code, for example to walk a user through a board or to replay what a backend job did. Add it to the editor once it is ready, and every action animates on the canvas:

```ts
const guide = new KritzelAgent({ name: "Guide", color: "#0EA5E9" });
await editor.addAgent(guide);

await guide.task("Setting up the board", async () => {
  const { objectIds } = await guide.createShape({
    x: 0,
    y: 0,
    width: 240,
    height: 120,
    text: "Ideas",
  });
  await guide.createText({
    x: 0,
    y: 160,
    text: "Ask the Assistant for a widget!",
  });
  await guide.moveTo({ objectId: objectIds![0], anchor: "bottom-right" });
});
```

`task()` shows its label as the agent's status while it runs, and stops at the first action that can't be completed. Several agents can work on the same canvas at once, each with its own cursor, and the user can follow every one of them.

The [Agents guide](/docs/react/advanced/agents) covers the rest, including agents that point at elements inside widgets, conflicts with the user's work, and presence for collaborators.

<BlogVideo src="/videos/2026_11_04_Agentic_Canvas_Cursors.mp4" label="Agentic cursors working on the Kritzel canvas" />

Before you ship. Backend API keys, sandboxing, multiplayer sync, any model provider.
Bonus: let your coding agent help. npx skills add kasual1/kritzel, two or three sentences.
Wrap-up. Links to /agentic, the docs and GitHub, plus what’s coming next in the series.
