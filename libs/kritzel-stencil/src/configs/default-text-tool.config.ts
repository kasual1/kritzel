import { KritzelTextToolConfig } from "../interfaces/toolbar-control.interface";
import { DEFAULT_COLOR_PALETTE } from "../constants/color-palette.constants";
import { DEFAULT_FONT_SIZES } from "../constants/stroke-size.constants";

export const DEFAULT_TEXT_CONFIG: KritzelTextToolConfig = {
  color: DEFAULT_COLOR_PALETTE[0],
  size: 8,
  fontFamily: 'Arial',
  palette: [...DEFAULT_COLOR_PALETTE],
  sizes: [...DEFAULT_FONT_SIZES],
};