import { KritzelBrushToolConfig } from '../interfaces/toolbar-control.interface';
import { DEFAULT_COLOR_PALETTE } from '../constants/color-palette.constants';

export const DEFAULT_BRUSH_CONFIG: KritzelBrushToolConfig = {
  type: 'pen',
  color: DEFAULT_COLOR_PALETTE[0],
  size: 16,
  palettes: {
    pen: [...DEFAULT_COLOR_PALETTE],
  },
};


