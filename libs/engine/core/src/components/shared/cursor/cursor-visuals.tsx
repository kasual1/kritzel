import { FunctionalComponent, h } from '@stencil/core';
import { KritzelOverlayEdge } from '@kritzel/core';

/** Arrow-shaped pointer used by remote and agentic cursors. */
export const CursorArrow: FunctionalComponent<{ color: string }> = ({ color }) => (
  <svg class="cursor-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3L19 12L12 13L9 20L5 3Z" fill={color} stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" />
  </svg>
);

/** Name label rendered next to a cursor arrow. */
export const CursorLabel: FunctionalComponent<{ color: string; text: string }> = ({ color, text }) => (
  <span class="cursor-label" style={{ backgroundColor: color }}>
    {text}
  </span>
);

interface EdgeIndicatorProps {
  /** Stable vdom key for the indicator element. */
  indicatorKey: string;
  x: number;
  y: number;
  /** Direction towards the off-screen cursor, in radians. */
  angle: number;
  edge: KritzelOverlayEdge;
  color: string;
  label: string;
  classes?: Record<string, boolean>;
}

const EDGE_LABEL_OFFSET = 20;

/** Indicator pinned to the viewport edge, pointing towards an off-screen cursor. */
export const EdgeIndicator: FunctionalComponent<EdgeIndicatorProps> = ({ indicatorKey, x, y, angle, edge, color, label, classes }) => {
  const arrowDeg = (angle * 180) / Math.PI + 90;

  // Position the label on the side facing into the viewport
  let labelX = 0;
  let labelY = 0;
  if (edge === 'left') {
    labelX = EDGE_LABEL_OFFSET;
  } else if (edge === 'right') {
    labelX = -EDGE_LABEL_OFFSET;
  } else if (edge === 'top') {
    labelY = EDGE_LABEL_OFFSET;
  } else if (edge === 'bottom') {
    labelY = -EDGE_LABEL_OFFSET;
  }

  return (
    <div key={indicatorKey} class={{ 'edge-indicator': true, ...classes }} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <svg class={{ 'edge-arrow': true, ...classes }} width="16" height="16" viewBox="0 0 16 16" style={{ transform: `rotate(${arrowDeg}deg)` }}>
        <path d="M8 1L14 13H2L8 1Z" fill={color} stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" />
      </svg>
      <span
        class="edge-label"
        style={{
          backgroundColor: color,
          transform: `translate(${labelX}px, ${labelY}px)`,
        }}
      >
        {label}
      </span>
    </div>
  );
};
