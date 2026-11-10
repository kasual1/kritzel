---
title: "What Is an Agentic Canvas? And How to Build One"
description: "Agentic canvases let AI agents work alongside people on an infinite canvas. Learn what they are, who builds them, and how to create your own with Kritzel."
date: 2026-11-01
thumbnail: /videos/2026_11_04_Agentic_Canvas.mp4
thumbnailSeed: "e5315435"
image: /img/blog/what-is-an-agentic-canvas.png
---

import BlogVideo from '@site/src/components/BlogVideo';

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

An agentic canvas usually consists of a DOM based canvas at its core that renders objects as plain html elements. That DOM based nature gives it one of it's most powerful features, namely to add not only paths and shapes but rich html content such as forms, videos or even entire web apps.
Those canvases usually come with agentic utility components such as cursors, a chatbox and configurable object titlebars, that makes it easy to hook up an LLM and give it full control over the canvas space.
Often the API provided by such canvases is declaratively configurable and can easily be used to adjust the canvas state by simply manipulating JSON objects. This allows not only humans but also agents to easily interact with the canvas in a programmatic way.


## Building one with Kritzel. 

In the following section we are going to use the Kritzel library to quickly setup an agentic canvas. This is intended to only give a rough overview and both parts of the setup are covered in more detail in separate blog posts.

### Generative UI

Since Kritzel renders its objects as DOM, a model can simply write HTML and a `KritzelIframeObject` runs it in a sandboxed iframe right on the canvas. Besides `@kritzel/react-editor` we only need Anthropic's TypeScript SDK.

```bash
npm install @kritzel/react-editor @anthropic-ai/sdk
```

```tsx title="GenerativeUi.tsx"
import { useRef, useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { KritzelEditor, KritzelIframeObject, type HTMLKritzelEditorElement } from '@kritzel/react-editor';

// Put your own Anthropic API key here.
const ANTHROPIC_API_KEY = 'sk-ant-...';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true });

const SYSTEM_PROMPT =
  'You build small web UIs. Reply with only the HTML for the <body> of a 400 × 400 px page that does not scroll: ' +
  'a <style> tag, the markup and an optional <script>. Draw images and icons with inline SVG or CSS, no external files. ' +
  'No <html>, <head> or <body> tags, no Markdown, no explanations.';

export function GenerativeUi() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function generate(prompt: string) {
    const editor = editorRef.current;
    if (!editor || abortRef.current) return;
    const abort = (abortRef.current = new AbortController());
    setIsWorking(true);

    // An empty UI in the middle of the viewport that shows a placeholder until Claude answers.
    const ui = new KritzelIframeObject({
      width: 400,
      height: 400,
      isLoading: true,
    });

    try {
      const { width, height } = await editor.getViewport();
      const center = await editor.screenToWorld(width / 2, height / 2);
      ui.translateX = center.x - 200;
      ui.translateY = center.y - 200;
      await editor.addObject(ui);

      const message = await client.beta.messages.create(
        {
          model: 'claude-opus-5-5',
          max_tokens: 16000,
          // If Claude declines a request, the API hands it to another Claude model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        },
        { signal: abort.signal },
      );
      if (message.stop_reason !== 'end_turn') throw new Error(`Claude stopped early (${message.stop_reason}).`);

      ui.setContent({ html: message.content.map((block) => (block.type === 'text' ? block.text : '')).join('') });
      ui.setLoading(false);
    } catch (error) {
      await editor.removeObject(ui);
      if (!abort.signal.aborted) {
        await editor.triggerNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      abortRef.current = null;
      setIsWorking(false);
    }
  }

  return (
    <KritzelEditor
      ref={editorRef}
      isChatBoxVisible
      isChatBoxLoading={isWorking}
      onChatSubmit={(event) => void generate(event.detail)}
      onChatStop={() => abortRef.current?.abort()}
      style={{ display: 'block', width: '100%', height: '100vh' }}
    />
  );
}
```

`onChatSubmit` hands us the prompt, `isChatBoxLoading` keeps the chat box busy while Claude writes, and its stop button cancels the request through `onChatStop`. Each prompt adds a `KritzelIframeObject` with `isLoading: true`, so the engine draws its loading placeholder over it until `setContent` and `setLoading(false)` swap in Claude's HTML.

Put your own key into `ANTHROPIC_API_KEY`, then type something like “Please create a jazz album cover” into the chat box. Generated scripts run inside the iframe's sandbox, so you can also ask for a small game or a calculator and select it to play. A key in browser code is readable by anyone who opens the page, so keep this setup to trying things out; more on that below.

The full [Generative UI example](/docs/react/examples/generative-ui) in the docs goes further, with titlebars, a fullscreen preview, follow-up prompts that change a selected UI and other model providers.

<BlogVideo src="/videos/2026_11_04_Agentic_Canvas_Generative_UI.mp4" label="An agent generating UI on the Kritzel canvas" />

### Agentic Cursors

<BlogVideo src="/videos/2026_11_04_Agentic_Canvas_Cursors.mp4" label="Agentic cursors working on the Kritzel canvas" />

One short paragraph per part with a small snippet. Generative UI and agentic cursors each end with “→ deep dive” links to posts 2 and 3.


Before you ship. Backend API keys, sandboxing, multiplayer sync, any model provider.
Bonus: let your coding agent help. npx skills add kasual1/kritzel, two or three sentences.
Wrap-up. Links to /agentic, the docs and GitHub, plus what’s coming next in the series.