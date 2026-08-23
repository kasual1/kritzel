import { KritzelBrushToolConfig } from '../interfaces/toolbar-item.interface';
import { DEFAULT_COLOR_PALETTE } from '../constants/color-palette.constants';
import { DEFAULT_STROKE_SIZES } from '../constants/stroke-size.constants';

export const DEFAULT_BRUSH_CONFIG: KritzelBrushToolConfig = {
  type: 'pen',
  color: DEFAULT_COLOR_PALETTE[0],
  size: 16,
  opacity: 1,
  palettes: {
    pen: [...DEFAULT_COLOR_PALETTE],
  },
  sizes: {
    pen: [...DEFAULT_STROKE_SIZES],
  },
};


