import { KritzelShapeToolConfig } from "../interfaces/toolbar-control.interface";
import { ShapeType } from "../enums/shape-type.enum";

export const DEFAULT_SHAPE_CONFIG: KritzelShapeToolConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: 'transparent',
  strokeColor: '#000000',
  strokeWidth: 4,
  fontColor: '#000000',
  fontSize: 16,
  fontFamily: 'Arial',
  palette: [
    '#000000',
    '#ff5252',
    '#ffbc00',
    '#00c853',
    '#0000FF',
    '#d500f9',
    '#fafafa',
    '#a52714',
    '#ee8100',
    '#558b2f',
    '#01579b',
    '#8e24aa',
    '#90a4ae',
  ],
};
