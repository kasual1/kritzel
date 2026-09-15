import { ConfigurableTool, ToolConfigDefinition } from '../interfaces/tool-config.interface';

export class KritzelToolConfigHelper {
  static getToolConfig(tool: ConfigurableTool): ToolConfigDefinition | null {
    switch (tool?.toolType) {
      case 'selection':
        return 'getToolConfig' in tool && typeof (tool as any).getToolConfig === 'function'
          ? (tool as any).getToolConfig()
          : null;

      case 'brush':
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

      case 'line':
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

      case 'shape':
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

      case 'text':
        return {
          type: 'text',
          colorProperty: 'fontColor',
          sizeProperty: 'fontSize',
          opacityProperty: 'opacity',
          paletteSource: 'palette',
          sizesSource: 'sizes',
          controls: [
            { type: 'font-size', propertyName: 'fontSize', additionalProps: {} },
            { type: 'font-family', propertyName: 'fontFamily' },
          ],
        };

      default:
        return null;
    }
  }
}
