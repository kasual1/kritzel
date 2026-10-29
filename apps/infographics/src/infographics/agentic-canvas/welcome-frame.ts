import type { KritzelIframeObject } from '@kritzel/react-editor';
import { createFrame } from './frame';

/** The frame the canvas starts with: a short guide to what Claude can do here. */
export function createWelcomeFrame(hasApiKey: boolean): KritzelIframeObject {
  const hint = hasApiKey
    ? 'Type into the chat box below. Claude adds frames and designs them while you watch.'
    : 'Add your Anthropic API key to <code>agent-config.ts</code>, then type into the chat box below.';

  return createFrame({
    name: 'Start here',
    x: -480,
    y: -320,
    width: 960,
    height: 640,
    content: {
      html: `
        <main>
          <p class="eyebrow">Infinite agentic canvas</p>
          <h1>Describe a page.<br>Claude builds it.</h1>
          <p class="hint">${hint}</p>
          <ul>
            <li>“Build a landing page for a coffee subscription”</li>
            <li>“Add a phone version next to it”</li>
            <li>“Make the hero darker and the buttons rounder”</li>
          </ul>
          <p class="hint small">Press <kbd>▶</kbd> in a titlebar to open a page in fullscreen.</p>
        </main>`,
      css: `
        body { display: grid; place-items: center; background: radial-gradient(circle at 20% 0%, #eef2ff, #ffffff 60%); font-family: system-ui, sans-serif; color: #18181b; }
        main { max-width: 640px; padding: 48px; }
        .eyebrow { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #4a7dff; }
        h1 { margin: 12px 0 20px; font-size: 52px; line-height: 1.05; letter-spacing: -0.03em; }
        .hint { margin: 0 0 24px; font-size: 18px; line-height: 1.5; color: #52525b; }
        .hint.small { margin: 24px 0 0; font-size: 15px; }
        ul { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
        li { padding: 12px 16px; border-radius: 12px; background: #f4f4f5; font-size: 16px; color: #3f3f46; }
        code, kbd { padding: 2px 6px; border-radius: 6px; background: #e4e4e7; font-size: 0.9em; }`,
    },
  });
}
