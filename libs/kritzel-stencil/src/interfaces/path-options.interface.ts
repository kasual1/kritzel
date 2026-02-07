import { ThemeAwareColor } from '../constants/color-palette.constants';

export interface KritzelPathOptions {
  points: number[][];
  translateX?: number;
  translateY?: number;
  scale?: number;
  stroke?: ThemeAwareColor;
  strokeWidth?: number;
  fill?: ThemeAwareColor;
  opacity?: number;
}
