import { KritzelBrushTool } from '../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../classes/tools/line-tool.class';
import { KritzelShapeTool } from '../classes/tools/shape-tool.class';
import { KritzelTextTool } from '../classes/tools/text-tool.class';
import { KritzelSelectionTool } from '../classes/tools/selection-tool.class';

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

export type ConfigurableTool = KritzelBrushTool | KritzelLineTool | KritzelShapeTool | KritzelTextTool | KritzelSelectionTool;

export interface ToolDisplayValues {
  color: string;
  size: number;
  fontFamily?: string;
}
