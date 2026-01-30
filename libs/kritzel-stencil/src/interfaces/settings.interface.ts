export interface KritzelSettingsConfig {
  /** Minimum zoom level allowed (0.0001 to 1) */
  scaleMin: number;
  /** Maximum zoom level allowed (1 to 1000) */
  scaleMax: number;
  /** When true, objects are drawn at a fixed visual size regardless of zoom level */
  lockDrawingScale: boolean;
}
