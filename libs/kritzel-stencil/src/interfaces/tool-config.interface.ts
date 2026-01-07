import { KritzelBrushTool } from '../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../classes/tools/line-tool.class';
import { KritzelShapeTool } from '../classes/tools/shape-tool.class';
import { KritzelTextTool } from '../classes/tools/text-tool.class';

export type ToolConfigType = 'brush' | 'line' | 'shape' | 'text';

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
  paletteSource: 'palette' | 'palettes' | 'custom';
  showColorPaletteFirst?: boolean;
  controls: ToolConfigControl[];
}

export type ConfigurableTool = KritzelBrushTool | KritzelLineTool | KritzelShapeTool | KritzelTextTool;

export function getToolConfig(tool: ConfigurableTool): ToolConfigDefinition {
  if (tool instanceof KritzelBrushTool) {
    return {
      type: 'brush',
      colorProperty: 'color',
      sizeProperty: 'size',
      opacityProperty: 'opacity',
      paletteSource: 'palettes',
      showColorPaletteFirst: true,
      controls: [
        { type: 'stroke-size', propertyName: 'size' },
      ],
    };
  }

  if (tool instanceof KritzelLineTool) {
    return {
      type: 'line',
      colorProperty: 'color',
      sizeProperty: 'size',
      opacityProperty: 'opacity',
      paletteSource: 'palette',
      showColorPaletteFirst: true,
      controls: [
        { type: 'stroke-size', propertyName: 'size' },
        { type: 'line-endings', propertyName: 'arrows', additionalProps: {} },
      ],
    };
  }

  if (tool instanceof KritzelShapeTool) {
    return {
      type: 'shape',
      colorProperty: 'strokeColor',
      sizeProperty: 'strokeWidth',
      opacityProperty: 'opacity',
      paletteSource: 'palette',
      showColorPaletteFirst: true,
      controls: [
        { type: 'stroke-size', propertyName: 'strokeWidth' },
        { type: 'shape-fill', propertyName: 'fillColor', additionalProps: {} },
      ],
    };
  }

  if (tool instanceof KritzelTextTool) {
    return {
      type: 'text',
      colorProperty: 'fontColor',
      sizeProperty: 'fontSize',
      opacityProperty: 'opacity',
      paletteSource: 'palette',
      showColorPaletteFirst: false,
      controls: [
        { type: 'font-family', propertyName: 'fontFamily' },
        { type: 'font-size', propertyName: 'fontSize', additionalProps: {} },
      ],
    };
  }

  // Fallback - should never reach here
  console.error(`Unknown tool type:`, tool);
  throw new Error(`Unknown tool type`);
}
