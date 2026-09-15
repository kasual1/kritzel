import { KritzelTextToolConfig } from "../interfaces/toolbar-item.interface";
import { DEFAULT_COLOR_PALETTE } from "../constants/color-palette.constants";
import { DEFAULT_FONT_SIZES } from "../constants/stroke-size.constants";
import { DEFAULT_TEXT_TOOL_AVAILABLE_FONTS } from '../constants/text-tool-fonts.constants';

export const DEFAULT_TEXT_CONFIG: KritzelTextToolConfig = {
  color: DEFAULT_COLOR_PALETTE[0],
  size: 8,
  opacity: 1,
  fontFamily: 'Arial',
  availableFonts: [...DEFAULT_TEXT_TOOL_AVAILABLE_FONTS],
  palette: [...DEFAULT_COLOR_PALETTE],
  sizes: [...DEFAULT_FONT_SIZES],
};