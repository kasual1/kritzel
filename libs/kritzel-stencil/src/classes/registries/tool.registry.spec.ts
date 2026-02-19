import { KritzelToolRegistry } from './tool.registry';

jest.mock('../core/core.class');
jest.mock('../tools/base-tool.class');

describe('KritzelToolRegistry', () => {
  let mockCore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the static registry between tests
    (KritzelToolRegistry as any).registry = {};
    mockCore = {};
  });

  describe('registerTool', () => {
    it('should create a tool instance and register it by name', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;

      const result = KritzelToolRegistry.registerTool('brush', MockTool, mockCore);

      expect(MockTool).toHaveBeenCalledWith(mockCore);
      expect(result).toBe(mockInstance);
      expect(result.name).toBe('brush');
    });

    it('should overwrite an existing tool with the same name', () => {
      const first = { name: '' };
      const second = { name: '' };
      const FirstTool = jest.fn(() => first) as any;
      const SecondTool = jest.fn(() => second) as any;

      KritzelToolRegistry.registerTool('brush', FirstTool, mockCore);
      KritzelToolRegistry.registerTool('brush', SecondTool, mockCore);

      expect(KritzelToolRegistry.getTool('brush')).toBe(second);
    });

    it('should register multiple tools independently', () => {
      const brushInstance = { name: '' };
      const eraserInstance = { name: '' };
      const BrushTool = jest.fn(() => brushInstance) as any;
      const EraserTool = jest.fn(() => eraserInstance) as any;

      KritzelToolRegistry.registerTool('brush', BrushTool, mockCore);
      KritzelToolRegistry.registerTool('eraser', EraserTool, mockCore);

      expect(KritzelToolRegistry.getTool('brush')).toBe(brushInstance);
      expect(KritzelToolRegistry.getTool('eraser')).toBe(eraserInstance);
    });
  });

  describe('getTool', () => {
    it('should return the registered tool instance', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;
      KritzelToolRegistry.registerTool('selection', MockTool, mockCore);

      const result = KritzelToolRegistry.getTool('selection');

      expect(result).toBe(mockInstance);
    });

    it('should return null and warn for an unregistered tool', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      const result = KritzelToolRegistry.getTool('nonexistent');

      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith('Unknown tool: nonexistent');

      spy.mockRestore();
    });
  });

  describe('getToolByIndex', () => {
    it('should return tool at the given index based on registration order', () => {
      const brushInstance = { name: '' };
      const eraserInstance = { name: '' };
      const selectionInstance = { name: '' };
      const BrushTool = jest.fn(() => brushInstance) as any;
      const EraserTool = jest.fn(() => eraserInstance) as any;
      const SelectionTool = jest.fn(() => selectionInstance) as any;

      KritzelToolRegistry.registerTool('brush', BrushTool, mockCore);
      KritzelToolRegistry.registerTool('eraser', EraserTool, mockCore);
      KritzelToolRegistry.registerTool('selection', SelectionTool, mockCore);

      expect(KritzelToolRegistry.getToolByIndex(0)).toBe(brushInstance);
      expect(KritzelToolRegistry.getToolByIndex(1)).toBe(eraserInstance);
      expect(KritzelToolRegistry.getToolByIndex(2)).toBe(selectionInstance);
    });

    it('should return null for out-of-bounds index', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;
      KritzelToolRegistry.registerTool('brush', MockTool, mockCore);

      expect(KritzelToolRegistry.getToolByIndex(5)).toBeNull();
      expect(KritzelToolRegistry.getToolByIndex(-1)).toBeNull();
    });
  });
});
