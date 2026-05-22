import { KritzelBrushTool } from '../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../classes/tools/line-tool.class';
import { KritzelShapeTool } from '../classes/tools/shape-tool.class';
import { KritzelTextTool } from '../classes/tools/text-tool.class';
import { KritzelSelectionTool } from '../classes/tools/selection-tool.class';
import { ConfigurableTool, ToolConfigDefinition } from '../interfaces/tool-config.interface';

export class KritzelToolConfigHelper {
  static getToolConfig(tool: ConfigurableTool): ToolConfigDefinition | null {
    const toolConstructorName = tool?.constructor?.name;

    if (tool instanceof KritzelSelectionTool || toolConstructorName === 'KritzelSelectionTool') {
      return (tool as KritzelSelectionTool).getToolConfig();
    }

    if (tool instanceof KritzelBrushTool || toolConstructorName === 'KritzelBrushTool') {
      return {
        type: 'brush',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        sizesSource: 'sizes',
        controls: [
          { type: 'stroke-size', propertyName: 'size' },
        ],
      };
    }

    if (tool instanceof KritzelLineTool || toolConstructorName === 'KritzelLineTool') {
      return {
        type: 'line',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        sizesSource: 'sizes',
        controls: [
          { type: 'stroke-size', propertyName: 'size' },
          { type: 'line-endings', propertyName: 'arrows', additionalProps: {} },
        ],
      };
    }

    if (tool instanceof KritzelShapeTool || toolConstructorName === 'KritzelShapeTool') {
      return {
        type: 'shape',
        colorProperty: 'strokeColor',
        sizeProperty: 'strokeWidth',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        sizesSource: 'sizes',
        controls: [
          { type: 'stroke-size', propertyName: 'strokeWidth' },
          { type: 'shape-fill', propertyName: 'fillColor', additionalProps: {} },
        ],
      };
    }

    if (tool instanceof KritzelTextTool || toolConstructorName === 'KritzelTextTool') {
      return {
        type: 'text',
        colorProperty: 'fontColor',
        sizeProperty: 'fontSize',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        sizesSource: 'none',
        controls: [
          { type: 'font-size', propertyName: 'fontSize', additionalProps: {} },
          { type: 'font-family', propertyName: 'fontFamily' },
        ],
      };
    }

    // Tool is not configurable (e.g., selection, eraser, image)
    return null;
  }
}
