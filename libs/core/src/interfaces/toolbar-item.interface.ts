import { UpdrawBaseTool } from '../classes/tools/base-tool.class';
import { UpdrawIconName } from '../classes/registries/icon-registry.class';
import { ShapeType } from '../enums/shape-type.enum';
import { ThemeAwareColor } from '../constants/color-palette.constants';
import { UpdrawFontRegistration } from './font.interface';

export interface UpdrawToolbarSubOption {
  id: string;
  icon: UpdrawIconName;
  label: string;
  value: any;
  toolProperty: string;
}

export interface UpdrawToolbarItem {
  type: 'tool' | 'config' | 'separator';
  tool?: (new (...args: any[]) => UpdrawBaseTool) | UpdrawBaseTool;
  icon?: UpdrawIconName;
  isDefault?: boolean;
  isDisabled?: boolean | (() => boolean | Promise<boolean>);
  name: string;
  config?: UpdrawTextToolConfig | UpdrawBrushToolConfig | UpdrawLineToolConfig | UpdrawShapeToolConfig;
  subOptions?: UpdrawToolbarSubOption[];
}

export interface UpdrawTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  fontFamily: string;
  availableFonts?: UpdrawFontRegistration[];
  palette: ThemeAwareColor[];
  sizes?: number[];
}

export interface UpdrawBrushToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  palette: ThemeAwareColor[];
  sizes?: number[];
}

export interface UpdrawLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  palette: ThemeAwareColor[];
  sizes?: number[];
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}

export interface UpdrawShapeToolConfig {
  shapeType: ShapeType;
  fillColor: ThemeAwareColor;
  strokeColor: ThemeAwareColor;
  strokeWidth: number;
  opacity?: number;
  fontColor: ThemeAwareColor;
  fontSize: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
  sizes?: number[];
}
