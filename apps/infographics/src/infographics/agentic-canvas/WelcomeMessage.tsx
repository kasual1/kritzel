import type { CSSProperties } from 'react';

export interface WelcomeMessageProps {
  isVisible: boolean;
  hasApiKey: boolean;
}

/** Lets clicks and wheel events through to the canvas, so the message never gets in the way. */
const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  pointerEvents: 'none',
  transition: 'opacity 240ms ease-out, transform 240ms ease-out',
};

const contentStyle: CSSProperties = {
  maxWidth: 640,
  padding: '0 24px 96px',
  fontFamily: 'system-ui, sans-serif',
  color: '#18181b',
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#4a7dff',
};

const titleStyle: CSSProperties = {
  margin: '12px 0 20px',
  fontSize: 52,
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
};

const hintStyle: CSSProperties = {
  margin: '0 0 24px',
  fontSize: 18,
  lineHeight: 1.5,
  color: '#52525b',
};

const listStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const itemStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  background: '#f4f4f5',
  fontSize: 16,
  color: '#3f3f46',
};

const codeStyle: CSSProperties = {
  padding: '2px 6px',
  borderRadius: 6,
  background: '#e4e4e7',
  fontSize: '0.9em',
};

const EXAMPLE_PROMPTS = [
  'Build a landing page for a coffee subscription',
  'Add a phone version next to it',
  'Make the hero darker and the buttons rounder',
];

/** The empty-canvas guide, centered on the canvas until Claude adds the first frame. */
export function WelcomeMessage({ isVisible, hasApiKey }: WelcomeMessageProps) {
  return (
    <div
      style={{ ...overlayStyle, opacity: isVisible ? 1 : 0, transform: isVisible ? 'none' : 'scale(0.98)' }}
      aria-hidden={!isVisible}
    >
      <div style={contentStyle}>
        <p style={eyebrowStyle}>Infinite agentic canvas</p>
        <h1 style={titleStyle}>
          Describe a page.
          <br />
          Claude builds it.
        </h1>
        <p style={hintStyle}>
          {hasApiKey ? (
            'Type into the chat box below. Claude adds frames and designs them while you watch.'
          ) : (
            <>
              Add your Anthropic API key to <code style={codeStyle}>agent-config.ts</code>, then type into the chat box below.
            </>
          )}
        </p>
        <ul style={listStyle}>
          {EXAMPLE_PROMPTS.map(prompt => (
            <li key={prompt} style={itemStyle}>
              “{prompt}”
            </li>
          ))}
        </ul>
        <p style={{ ...hintStyle, margin: '24px 0 0', fontSize: 15 }}>
          Press <kbd style={codeStyle}>▶</kbd> in a titlebar to open a page in fullscreen.
        </p>
      </div>
    </div>
  );
}
