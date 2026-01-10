import { KritzelShapeToolConfig } from "../interfaces/toolbar-control.interface";
import { ShapeType } from "../enums/shape-type.enum";
import { DEFAULT_COLOR_PALETTE } from "../constants/color-palette.constants";

export const DEFAULT_SHAPE_CONFIG: KritzelShapeToolConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: 'transparent',
  strokeColor: '#000000',
  strokeWidth: 4,
  fontColor: '#000000',
  fontSize: 16,
  fontFamily: 'Arial',
  palette: [...DEFAULT_COLOR_PALETTE],
};
