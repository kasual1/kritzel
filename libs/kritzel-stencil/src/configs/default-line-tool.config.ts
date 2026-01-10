import { KritzelLineToolConfig } from '../interfaces/toolbar-control.interface';
import { DEFAULT_COLOR_PALETTE } from '../constants/color-palette.constants';

export const DEFAULT_LINE_TOOL_CONFIG: KritzelLineToolConfig = {
  color: '#000000',
  size: 4,
  palette: [...DEFAULT_COLOR_PALETTE],
  arrows: {
    end: { enabled: true, style: 'triangle' },
  },
};
