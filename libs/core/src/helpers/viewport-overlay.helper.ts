import { KritzelPoint } from '../interfaces/point.interface';

/** Minimal viewport state needed to project world coordinates into overlay (screen) coordinates. */
export interface KritzelOverlayViewportState {
  scale: number;
  translateX: number;
  translateY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export type KritzelOverlayEdge = 'top' | 'right' | 'bottom' | 'left';

export interface KritzelEdgeClampResult {
  x: number;
  y: number;
  /** Angle (radians) pointing from the clamped position towards the off-screen point. */
  angle: number;
  edge: KritzelOverlayEdge;
}

/**
 * Shared geometry for screen-space overlays (remote cursors, agentic cursors) rendered
 * on top of the engine.
 */
export class KritzelViewportOverlayHelper {
  static worldToScreen(state: KritzelOverlayViewportState, worldX: number, worldY: number): KritzelPoint {
    return {
      x: worldX * state.scale + state.translateX,
      y: worldY * state.scale + state.translateY,
    };
  }

  static isInViewport(state: KritzelOverlayViewportState, screenX: number, screenY: number): boolean {
    return screenX >= 0 && screenX <= state.viewportWidth && screenY >= 0 && screenY <= state.viewportHeight;
  }

  /** Clamps an off-screen point to the viewport edge, returning the nearest edge and the direction to the point. */
  static clampToEdge(state: KritzelOverlayViewportState, screenX: number, screenY: number, padding: number): KritzelEdgeClampResult {
    const { viewportWidth, viewportHeight } = state;

    const clampedX = Math.max(padding, Math.min(viewportWidth - padding, screenX));
    const clampedY = Math.max(padding, Math.min(viewportHeight - padding, screenY));

    const distLeft = clampedX - padding;
    const distRight = viewportWidth - padding - clampedX;
    const distTop = clampedY - padding;
    const distBottom = viewportHeight - padding - clampedY;

    let edge: KritzelOverlayEdge = 'top';
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    if (minDist === distLeft) edge = 'left';
    else if (minDist === distRight) edge = 'right';
    else if (minDist === distTop) edge = 'top';
    else edge = 'bottom';

    const angle = Math.atan2(screenY - clampedY, screenX - clampedX);

    return { x: clampedX, y: clampedY, angle, edge };
  }

  static getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || (parts.length === 1 && parts[0].length <= 1)) {
      return name;
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
