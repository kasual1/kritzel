import { KritzelToolConfigHelper } from './tool-config.helper';

describe('KritzelToolConfigHelper', () => {
  describe('getToolConfig - SelectionTool', () => {
    it('should delegate to tool.getToolConfig() for SelectionTool', () => {
      const mockConfig = {
        type: 'selection',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        controls: [],
      };
      const tool = {
        toolType: 'selection',
        getToolConfig: jest.fn().mockReturnValue(mockConfig),
      } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(tool.getToolConfig).toHaveBeenCalled();
      expect(result).toBe(mockConfig);
    });

    it('should return null when SelectionTool.getToolConfig returns null', () => {
      const tool = {
        toolType: 'selection',
        getToolConfig: jest.fn().mockReturnValue(null),
      } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toBeNull();
    });
  });

  describe('getToolConfig - BrushTool', () => {
    it('should return brush config', () => {
      const tool = { toolType: 'brush' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
        type: 'brush',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        sizesSource: 'sizes',
        controls: [
          { type: 'stroke-size', propertyName: 'size' },
        ],
      });
    });

    it('should return brush config for a tool from another bundle instance', () => {
      const tool = { toolType: 'brush' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
        type: 'brush',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'palette',
        sizesSource: 'sizes',
        controls: [
          { type: 'stroke-size', propertyName: 'size' },
        ],
      });
    });
  });

  describe('getToolConfig - LineTool', () => {
    it('should return line config with stroke-size and line-endings controls', () => {
      const tool = { toolType: 'line' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
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
      });
    });
  });

  describe('getToolConfig - ShapeTool', () => {
    it('should return shape config with stroke-size and shape-fill controls', () => {
      const tool = { toolType: 'shape' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
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
      });
    });
  });

  describe('getToolConfig - TextTool', () => {
    it('should return text config with font-size and font-family controls', () => {
      const tool = { toolType: 'text' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toEqual({
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
      });
    });
  });

  describe('getToolConfig - unknown tool', () => {
    it('should return null for an unrecognized tool', () => {
      const unknownTool = {} as any;

      const result = KritzelToolConfigHelper.getToolConfig(unknownTool);

      expect(result).toBeNull();
    });

    it('should return null for eraser tool', () => {
      const tool = { toolType: 'eraser' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toBeNull();
    });

    it('should return null for image tool', () => {
      const tool = { toolType: 'image' } as any;

      const result = KritzelToolConfigHelper.getToolConfig(tool);

      expect(result).toBeNull();
    });
  });
});
