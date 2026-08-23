import { KritzelLineToolConfig } from '../interfaces/toolbar-item.interface';
import { DEFAULT_COLOR_PALETTE } from '../constants/color-palette.constants';
import { DEFAULT_STROKE_SIZES } from '../constants/stroke-size.constants';

export const DEFAULT_LINE_TOOL_CONFIG: KritzelLineToolConfig = {
  color: DEFAULT_COLOR_PALETTE[0],
  size: 4,
  opacity: 1,
  palette: [...DEFAULT_COLOR_PALETTE],
  sizes: [...DEFAULT_STROKE_SIZES],
  arrows: {
    end: { enabled: true, style: 'triangle' },
  },
};
