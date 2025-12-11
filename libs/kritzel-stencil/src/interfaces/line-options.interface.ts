import { LineAnchor } from './anchor.interface';

export interface KritzelLineOptions {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX?: number;
  controlY?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  stroke?: string;
  strokeWidth?: number;
  /** Anchor connection for the start point */
  startAnchor?: LineAnchor;
  /** Anchor connection for the end point */
  endAnchor?: LineAnchor;
}
