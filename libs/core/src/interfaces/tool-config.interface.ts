import { UpdrawBaseTool } from '../classes/tools/base-tool.class';

export type { UpdrawToolType } from './tool-type.interface';

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

export type ConfigurableTool = UpdrawBaseTool;

export interface ToolDisplayValues {
  color: string;
  size: number;
  fontFamily?: string;
}
