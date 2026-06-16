import { KritzelDebugInfo } from './debug-info.interface';
import { ThemeName } from './theme.interface';
import { LocaleCode } from './localization.interface';

export interface KritzelSettingsConfig {
  /** Minimum zoom level allowed (0.0001 to 1) */
  scaleMin: number;
  /** Maximum zoom level allowed (1 to 1000) */
  scaleMax: number;
  /** When true, objects are drawn at a fixed visual size regardless of zoom level */
  lockDrawingScale: boolean;
  /** The current theme name */
  theme: ThemeName;
  /** The current locale (language) code */
  locale: LocaleCode;
  /** Left boundary of the viewport in world coordinates */
  viewportBoundaryLeft: number;
  /** Right boundary of the viewport in world coordinates */
  viewportBoundaryRight: number;
  /** Top boundary of the viewport in world coordinates */
  viewportBoundaryTop: number;
  /** Bottom boundary of the viewport in world coordinates */
  viewportBoundaryBottom: number;
  /** Debug info display options */
  debugInfo: KritzelDebugInfo;
}
