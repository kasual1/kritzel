import { KritzelBrushToolConfig } from '../interfaces/toolbar-item.interface';
import { DEFAULT_COLOR_PALETTE } from '../constants/color-palette.constants';
import { DEFAULT_STROKE_SIZES } from '../constants/stroke-size.constants';

export const DEFAULT_BRUSH_CONFIG: KritzelBrushToolConfig = {
  color: DEFAULT_COLOR_PALETTE[0],
  size: 16,
  opacity: 1,
  palette: [...DEFAULT_COLOR_PALETTE],
  sizes: [...DEFAULT_STROKE_SIZES],
};


