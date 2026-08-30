import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { ShapeType } from '../enums/shape-type.enum';
import { ThemeAwareColor } from '../constants/color-palette.constants';
import { KritzelFontRegistration } from './font.interface';

export interface KritzelToolbarSubOption {
  id: string;
  icon: string;
  label: string;
  value: any;
  toolProperty: string;
}

export interface KritzelToolbarItem {
  type: 'tool' | 'config' | 'separator';
  tool?: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon?: string;
  isDefault?: boolean;
  name: string;
  config?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig;
  subOptions?: KritzelToolbarSubOption[];
}

export interface KritzelTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  fontFamily: string;
  availableFonts?: KritzelFontRegistration[];
  palette: ThemeAwareColor[];
  sizes?: number[];
}

export interface KritzelBrushToolConfig {
  color: ThemeAwareColor;
  size: number;
  opacity?: number;
  palette: ThemeAwareColor[];
  sizes?: number[];
}

export interface KritzelLineToolConfig {
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

export interface KritzelShapeToolConfig {
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
