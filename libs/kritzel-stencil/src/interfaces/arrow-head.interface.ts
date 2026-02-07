import { ThemeAwareColor } from '../constants/color-palette.constants';

/**
 * Arrow head style types
 */
export type ArrowHeadStyle = 'triangle' | 'open' | 'diamond' | 'circle';

/**
 * Configuration for a single arrow head
 */
export interface ArrowHeadConfig {
  /** Whether to display the arrow head */
  enabled: boolean;
  /** Arrow head style (defaults to 'triangle') */
  style?: ArrowHeadStyle;
  /** Size of the arrow head in pixels (defaults to strokeWidth * 3) */
  size?: number;
  /** Fill color (defaults to stroke color of the line) */
  fill?: ThemeAwareColor;
}

/**
 * Configuration for arrow heads at both ends of a line
 */
export interface LineArrowConfig {
  /** Arrow head at the start of the line */
  start?: ArrowHeadConfig;
  /** Arrow head at the end of the line */
  end?: ArrowHeadConfig;
}
