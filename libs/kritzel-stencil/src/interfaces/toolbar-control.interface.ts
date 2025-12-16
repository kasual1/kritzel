import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { ShapeType } from '../enums/shape-type.enum';

export interface KritzelToolbarControl {
  type: 'tool' | 'divider' | 'config';
  tool?: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon?: string;
  isDefault?: boolean;
  name: string;
  config?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig;
}

export interface KritzelTextToolConfig {
  color: string;
  size: number;
  fontFamily: string;
  palette: string[];
}

export interface KritzelBrushToolConfig {
  type: 'pen' | 'highlighter';
  color: string;
  size: number;
  palettes: {
    [brushType: string]: string[];
  }
}

export interface KritzelLineToolConfig {
  color: string;
  size: number;
  palette: string[];
  /** Arrow head configuration for lines created with this tool */
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}

export interface KritzelShapeToolConfig {
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontColor: string;
  fontSize: number;
  fontFamily: string;
  palette: string[];
}
