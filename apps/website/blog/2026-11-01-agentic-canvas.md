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

## From chat window to canvas

Over the last couple of years the interaction with LLMs has undergone a paradigm shift from single chats to multi agent nonlinear workflows. While the chat window has proved to be the right tool for linear conversations AI companies more recently include spatial whiteboards specifically designed for visually related tasks such as brainstorming or prototyping.

{/* truncate */}

Those canvases are the natural fit for parallel agentic work, as they allow multiple users, or in this case agents, to iterate over different parts of the same shared space. The canvas in this case becomes a room that allows humans and agents to interact with each other asynchronously, meaning that tasks can progress and finish at their own speed instead of being bound to a linear flow like in a conversation.

## What makes a canvas “agentic”?

Very similar to how a regular infinite canvas provides humans with the tools to view and interact with the canvas, an agentic canvas provides that same capabilities, but to agents instead. Hence, on an agentic canvas the agent can perform all the same task a human would but in order for a human to better follow the agents work usually agents different states are visually highlighted.

## Who’s already building them

As mentioned earlier, quite a lot of companies have already integrated agentic canvas experiences into their products. Some of the most prominent players certainly are Miro, Figma and Framer, but also Anthropic's Design tool relies on an infinite canvas with agentic capabilities.
Those companies either have extended their closed source, internally developed canvas solutions with agentic capabilities on their own or rely on external propiertary providers such as tldraw to bring in agentic behaviour.

## What an agentic canvas is made of

An agentic canvas usually consists of a DOM based canvas at its core that renders objects as plain html elements. That DOM based nature gives it one of it's most powerful features, namely to add not only paths and shapes but rich HTML content such as forms, videos or even entire web apps.
Those canvases usually come with agentic utility components such as cursors, a chatbox and configurable object titlebars, that makes it easy to hook up an LLM and give it full control over the canvas space.
Often the API provided by such canvases is declaratively configurable and can easily be used to adjust the canvas state by simply manipulating JSON objects. This allows not only humans but also agents to easily interact with the canvas in a programmatic way.

## Building one with Kritzel

While it is feasible to start building an agentic canvas from scratch on your own, using a library that is specifically designed for this and takes out the tedious part of building a solid DOM based rendering engine, gives your development a jumpstart.

In the following sections we are going to use the Kritzel library to quickly setup an agentic canvas and run through its two most common use cases. This is intended to only give you a rough overview and both parts of the setup are covered in more detail in dedicated blog posts.

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

This provides us with a default editor, but it renders a tool panel instead of a chat interface at the bottom of the editor. To replace the tools with a chatbox, we simply set `isChatBoxVisible` on the editor to true.

While the editor now already very much looks like an agentic canvas, typing any commands in the chatbox does nothing. For this to work we need to hookup a new `KritzelChatSession` and configure a new http transport as depicted below. This guide assumes that you have a server running that can handle llm requests via an endpoint called "/api/chat".

```typescript
export function GenerativeUi() {
  const [session] = useState(
    () =>
      new KritzelChatSession({
        transport: createHttpTransport("/api/chat"),
      }),
  );

  return (
    <KritzelEditor
      chatSession={session}
      isChatBoxVisible={true}
      style={{ display: "block", width: "100%", height: "100vh" }}
    />
  );
}
```

Now the chatbox is hooked up to the server and can interact with all tools on the canvas. To make sure everything works as expected, type the command "Please draw a rectangle" into the chatbox and send it off by hitting enter. The chatbox should switch into it's loading state automatically and after a brief moment a rectangle should appear at the center of the screen.


### Generative UI

While the setup above gives you a pretty cool way to interact with Kritzel already, it gets even more powerful if you enable the LLM to generate arbitrary UI components on the canvas. In order to do so, just set `canvasTools: { iframes: true }` when configuring the `KritzelChatSession`.

As you now type: "Please generate a modern looking recording widget that helps me to record my new Jazz album called: 'Full Control'", you should get a similar output to the one depicted below.

<BlogVideo src="/videos/2026_11_04_Agentic_Canvas_Generative_UI.mp4" label="An agent generating UI on the Kritzel canvas" />

While the output certainly depends on the capabilities of the used LLM, there are some ways to fine tune the query and send general rules to improve the results. While the best way to do this is on the server where you pass the command on to the LLM, for this guide we configure the system prompt on the client as follows.

```typescript
const SYSTEM_PROMPT = `
When the user asks for something interactive, build it as a widget with create_iframe.
- Keep it self-contained: inline HTML, CSS and JavaScript only. Draw icons with inline SVG or CSS.
- Fit the content to the widget's size without scrollbars, and keep the layout responsive.
- Use a modern, clean design: system fonts, generous spacing, rounded corners, one accent color.
- Use accessible markup with good contrast, and give each widget a short, descriptive name.
- To change an existing widget, read its code first and update it instead of creating a new one.
`;
```
 You can pass those rules when creating the `KritzelChatSession` by setting `system: SYSTEM_PROMPT` in the constructors config. While those rules are obviously very general and fitted to the use case, this is a great first step to make the results more consistent and tune generated UI components more to your liking.

### Agentic Cursors

In all the examples above, the LLM model has worked as the current user when interacting with the canvas. As this suits smaller workflows well, more demanding tasks or an entire workflow may require to actually see what the model is doing. For this, Kritzel uses the concept of Agents. It allows you to add agents to the board that come with their own cursors and also with their own history. Tasks performed via the LLM are handed off to an agent and you can see them perform the assigned work on the canvas.

In order to unlock the so called "agent mode" you only have to configure a `KritzelAgent` and add it to the `KritzelChatSession`. The example below adds an agent called "Assistant" 

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
        agent: new KritzelAgent({ name: "Assistant", color: "#663399" }),
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

#### Clicking inside widgets

Creating objects is only half of what a cursor can do. Since the widgets on the canvas are real web pages, an agent can use them the same way a person would: press buttons, fill in fields or tick checkboxes. Let's take the recording widget from the Generative UI section and have the guide record a new track for the album. It moves to the record button and presses it, lets the recording run for 2.5 seconds and presses the button again to stop it. Then it stars the saved track and leaves the view.

```ts
const [recorder] = await editor.findObjects<KritzelIframeObject>(
  (object) => object instanceof KritzelIframeObject && object.name === "Full Control Recorder",
);

const recordButton = { objectId: recorder.id, selector: '[data-kritzel-id="record"]' };
const starButton = { objectId: recorder.id, selector: '[data-kritzel-id="star"]' };

await guide.task("Recording a new track", async () => {
  // Start the recording, let it run for 2.5 seconds, then stop it
  await guide.click(recordButton);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await guide.click(recordButton);

  // Star the track the widget just saved
  await guide.click(starButton);
});

// Leave through the bottom-right corner of the view
const viewport = await editor.getViewport();
await guide.moveTo({
  x: (viewport.width - viewport.translateX) / viewport.scale + 80,
  y: (viewport.height - viewport.translateY) / viewport.scale + 80,
});
await editor.removeAgent(guide);
```

Instead of a point on the canvas, the click targets an element inside the widget: the ID of the iframe object plus a CSS selector. The first element that matches the selector is used. Before the cursor moves, the widget scrolls the element into view and checks that it is visible, enabled and not covered by anything else. The cursor then flies to the button, presses it, and the widget's own click handler runs, exactly as if the user had clicked it. Afterwards the cursor sticks to the element, so it follows the button when the widget moves on the canvas or its layout changes while the recording runs.

If the button can't be clicked, for example because it is disabled, the result has `reason: 'element-interaction-failed'` together with an `elementReason` and a readable `message`. Inside `task()` such a result throws, so the guide never stars a track it didn't record. Selectors built from a `data-kritzel-id` are the most robust choice here, because they keep matching when the model regenerates the widget. That's why it is worth asking for them in the system prompt.

Note that the click changes the widget's own state, not the canvas, so there is nothing to undo, and collaborators don't see it. When a model drives the agent, it finds these elements by itself: the `inspect_elements` tool lists a widget's buttons and fields together with their selectors, and `interact_with_element` uses them in the same way.

The [Agents guide](/docs/react/advanced/agents) covers the rest, including agents that point at elements inside widgets, conflicts with the user's work, and presence for collaborators.

<BlogVideo src="/videos/2026_11_04_Agentic_Canvas_Cursors.mp4" label="Agentic cursors working on the Kritzel canvas" />

Before you ship. Backend API keys, sandboxing, multiplayer sync, any model provider.
Bonus: let your coding agent help. npx skills add kasual1/kritzel, two or three sentences.
Wrap-up. Links to /agentic, the docs and GitHub, plus what’s coming next in the series.
