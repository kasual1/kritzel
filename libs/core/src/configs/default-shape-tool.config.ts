import { KritzelShapeToolConfig } from "../interfaces/toolbar-item.interface";
import { ShapeType } from "../enums/shape-type.enum";
import { DEFAULT_COLOR_PALETTE } from "../constants/color-palette.constants";
import { DEFAULT_STROKE_SIZES } from "../constants/stroke-size.constants";

export const DEFAULT_SHAPE_CONFIG: KritzelShapeToolConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: 'transparent', dark: 'transparent' },
  strokeColor: DEFAULT_COLOR_PALETTE[0],
  strokeWidth: 4,
  opacity: 1,
  fontColor: DEFAULT_COLOR_PALETTE[0],
  fontSize: 16,
  fontFamily: 'Arial',
  palette: [...DEFAULT_COLOR_PALETTE],
  sizes: [...DEFAULT_STROKE_SIZES],
};
