import { KritzelToolConfigHelper } from './tool-config.helper';
import { KritzelBrushTool } from '../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../classes/tools/line-tool.class';
import { KritzelShapeTool } from '../classes/tools/shape-tool.class';
import { KritzelTextTool } from '../classes/tools/text-tool.class';
import { KritzelSelectionTool } from '../classes/tools/selection-tool.class';

jest.mock('../classes/tools/brush-tool.class');
jest.mock('../classes/tools/line-tool.class');
jest.mock('../classes/tools/shape-tool.class');
jest.mock('../classes/tools/text-tool.class');
jest.mock('../classes/tools/selection-tool.class');

const createMockTool = <T>(ToolClass: new (...args: any[]) => T, overrides: Record<string, any> = {}): T => {
  const tool = Object.create(ToolClass.prototype);
  return Object.assign(tool, overrides);
};

describe('KritzelToolConfigHelper', () => {
  describe('getToolConfig - SelectionTool', () => {
    it('should delegate to tool.getToolConfig() for SelectionTool', () => {
      const mockConfig = {
        type: 'selection' as const,
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette' as const,
        controls: [],
      };
      const tool = createMockTool(KritzelSelectionTool, {
        getToolConfig: jest.fn().mockReturnValue(mockConfig),
      });

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(tool.getToolConfig).toHaveBeenCalled();
      expect(result).toBe(mockConfig);
    });

    it('should return null when SelectionTool.getToolConfig returns null', () => {
      const tool = createMockTool(KritzelSelectionTool, {
        getToolConfig: jest.fn().mockReturnValue(null),
      });

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toBeNull();
    });
  });

  describe('getToolConfig - BrushTool', () => {
    it('should return brush config', () => {
      const tool = createMockTool(KritzelBrushTool);

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
        type: 'brush',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        controls: [
          { type: 'stroke-size', propertyName: 'size' },
        ],
      });
    });
  });

  describe('getToolConfig - LineTool', () => {
    it('should return line config with stroke-size and line-endings controls', () => {
      const tool = createMockTool(KritzelLineTool);

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
        type: 'line',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        controls: [
          { type: 'stroke-size', propertyName: 'size' },
          { type: 'line-endings', propertyName: 'arrows', additionalProps: {} },
        ],
      });
    });
  });

  describe('getToolConfig - ShapeTool', () => {
    it('should return shape config with stroke-size and shape-fill controls', () => {
      const tool = createMockTool(KritzelShapeTool);

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
        type: 'shape',
        colorProperty: 'strokeColor',
        sizeProperty: 'strokeWidth',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        controls: [
          { type: 'stroke-size', propertyName: 'strokeWidth' },
          { type: 'shape-fill', propertyName: 'fillColor', additionalProps: {} },
        ],
      });
    });
  });

  describe('getToolConfig - TextTool', () => {
    it('should return text config with font-size and font-family controls', () => {
      const tool = createMockTool(KritzelTextTool);

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
        type: 'text',
        colorProperty: 'fontColor',
        sizeProperty: 'fontSize',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        controls: [
          { type: 'font-size', propertyName: 'fontSize', additionalProps: {} },
          { type: 'font-family', propertyName: 'fontFamily' },
        ],
      });
    });
  });

  describe('getToolConfig - unknown tool', () => {
    it('should return null for an unrecognized tool', () => {
      const unknownTool = {} as any;

      const result = KritzelToolConfigHelper.getToolConfig(unknownTool);

      expect(result).toBeNull();
    });
  });
});
