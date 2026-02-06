import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { ShapeType } from '../enums/shape-type.enum';
import { ThemeAwareColor } from '../constants/color-palette.constants';

export interface KritzelToolbarSubOption {
  id: string;
  icon: string;
  label: string;
  value: any;
  toolProperty: string;
}

export interface KritzelToolbarControl {
  type: 'tool' | 'config';
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
  fontFamily: string;
  palette: ThemeAwareColor[];
}

export interface KritzelBrushToolConfig {
  type: 'pen' | 'highlighter';
  color: ThemeAwareColor;
  size: number;
  palettes: {
    [brushType: string]: ThemeAwareColor[];
  }
}

export interface KritzelLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
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
  fontColor: ThemeAwareColor;
  fontSize: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}
