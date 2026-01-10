import { KritzelTextToolConfig } from "../interfaces/toolbar-control.interface";
import { DEFAULT_COLOR_PALETTE } from "../constants/color-palette.constants";

export const DEFAULT_TEXT_CONFIG: KritzelTextToolConfig = {
  color: '#000000',
  size: 8,
  fontFamily: 'Arial',
  palette: [...DEFAULT_COLOR_PALETTE],
};