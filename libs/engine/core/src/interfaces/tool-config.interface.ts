import { KritzelBaseTool } from '../classes/tools/base-tool.class';

export type { KritzelToolType } from './tool-type.interface';

export type ToolConfigType = 'brush' | 'line' | 'shape' | 'text' | 'selection';

export interface ToolConfigControl {
  type: 'stroke-size' | 'font-size' | 'line-endings' | 'shape-fill' | 'font-family';
  label?: string;
  propertyName: string;
  additionalProps?: Record<string, any>;
}

export interface ToolConfigDefinition {
  type: ToolConfigType;
  colorProperty: string;
  sizeProperty: string;
  opacityProperty: string;
  paletteSource: 'palette' | 'none';
  sizesSource: 'sizes' | 'none';
  controls: ToolConfigControl[];
}

export type ConfigurableTool = KritzelBaseTool;

export interface ToolDisplayValues {
  color: string;
  size: number;
  fontFamily?: string;
}
