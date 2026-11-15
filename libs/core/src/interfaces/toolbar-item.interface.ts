import { UpmadeBaseTool } from '../classes/tools/base-tool.class';
import { UpmadeIconName } from '../classes/registries/icon-registry.class';
import { ShapeType } from '../enums/shape-type.enum';
import { ThemeAwareColor } from '../constants/color-palette.constants';
import { UpmadeFontRegistration } from './font.interface';

export interface UpmadeToolbarSubOption {
  id: string;
  icon: UpmadeIconName;
  label: string;
  value: any;
  toolProperty: string;
}

export interface UpmadeToolbarItem {
  type: 'tool' | 'config' | 'separator';
  tool?: (new (...args: any[]) => UpmadeBaseTool) | UpmadeBaseTool;
  icon?: UpmadeIconName;
  isDefault?: boolean;
  isDisabled?: boolean | (() => boolean | Promise<boolean>);
  name: string;
  config?: UpmadeTextToolConfig | UpmadeBrushToolConfig | UpmadeLineToolConfig | UpmadeShapeToolConfig;
  subOptions?: UpmadeToolbarSubOption[];
}

export interface UpmadeTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  fontFamily: string;
  availableFonts?: UpmadeFontRegistration[];
  palette: ThemeAwareColor[];
  sizes?: number[];
}

export interface UpmadeBrushToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  palette: ThemeAwareColor[];
  sizes?: number[];
}

export interface UpmadeLineToolConfig {
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

export interface UpmadeShapeToolConfig {
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
