import { UpmadeDynamicObject, UpmadeLine, type UpmadeBaseObject } from '@upmade/react-editor';
import type { Box } from '../agentic-canvas/hero-scene';
import { KRITZEL_LOGO_PATH, KRITZEL_LOGO_VIEWBOX, UPMADE_LOGO_PATH, UPMADE_LOGO_VIEWBOX } from './logos';

const LOGO_HEIGHT = 200;
const GAP = 60;
const ARROW_WIDTH = 160;
const ARROW_STROKE_WIDTH = 8;
const COLOR = '#000000';

function aspectRatio(viewBox: string): number {
  const [, , width, height] = viewBox.split(' ').map(Number);
  return width / height;
}

function svgObject(svg: string, width: number, height: number, translateX: number, translateY: number): UpmadeDynamicObject {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.innerHTML = svg;
  // 'none' overrides the theme's object shadow, so the logos sit flat on the canvas.
  return new UpmadeDynamicObject({ element, width, height, translateX, translateY, boxShadow: 'none' });
}

export interface RebrandObject {
  object: UpmadeBaseObject;
  /** Where the object sits in world coordinates. */
  box: Box;
}

/** The old Kritzel logo, an arrow line pointing right and the new Upmade logo, side by side and vertically centered. */
export function createRebrandObjects(): { kritzel: RebrandObject; arrow: RebrandObject; upmade: RebrandObject } {
  const kritzelWidth = LOGO_HEIGHT * aspectRatio(KRITZEL_LOGO_VIEWBOX);
  const upmadeWidth = LOGO_HEIGHT * aspectRatio(UPMADE_LOGO_VIEWBOX);
  const arrowX = kritzelWidth + GAP;
  const upmadeX = arrowX + ARROW_WIDTH + GAP;

  const kritzel = svgObject(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${KRITZEL_LOGO_VIEWBOX}" width="100%" height="100%" role="img" aria-label="Kritzel">
      <path fill="${COLOR}" stroke="${COLOR}" d="${KRITZEL_LOGO_PATH}" />
    </svg>`,
    kritzelWidth,
    LOGO_HEIGHT,
    0,
    0,
  );

  const arrow = new UpmadeLine({
    startX: arrowX,
    startY: LOGO_HEIGHT / 2,
    endX: arrowX + ARROW_WIDTH,
    endY: LOGO_HEIGHT / 2,
    stroke: { light: COLOR, dark: COLOR },
    strokeWidth: ARROW_STROKE_WIDTH,
    arrows: { end: { enabled: true, style: 'triangle' } },
  });

  const upmade = svgObject(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${UPMADE_LOGO_VIEWBOX}" width="100%" height="100%" role="img" aria-label="Upmade">
      <path fill="${COLOR}" d="${UPMADE_LOGO_PATH}" />
    </svg>`,
    upmadeWidth,
    LOGO_HEIGHT,
    upmadeX,
    0,
  );

  return {
    kritzel: { object: kritzel, box: { x: 0, y: 0, width: kritzelWidth, height: LOGO_HEIGHT } },
    arrow: {
      object: arrow,
      box: { x: arrowX, y: (LOGO_HEIGHT - ARROW_STROKE_WIDTH * 3) / 2, width: ARROW_WIDTH, height: ARROW_STROKE_WIDTH * 3 },
    },
    upmade: { object: upmade, box: { x: upmadeX, y: 0, width: upmadeWidth, height: LOGO_HEIGHT } },
  };
}
