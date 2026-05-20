import { KritzelToolRegistry } from './tool.registry';

jest.mock('../core/core.class');
jest.mock('../tools/base-tool.class');

describe('KritzelToolRegistry', () => {
  let mockCore: any;
  let registry: KritzelToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = {};
    registry = new KritzelToolRegistry(mockCore);
  });

  describe('registerTool', () => {
    it('should create a tool instance and register it by name', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;

      const result = registry.registerTool('brush', MockTool);

      expect(MockTool).toHaveBeenCalledWith(mockCore);
      expect(result).toBe(mockInstance);
      expect(result.name).toBe('brush');
    });

    it('should overwrite an existing tool with the same name', () => {
      const first = { name: '' };
      const second = { name: '' };
      const FirstTool = jest.fn(() => first) as any;
      const SecondTool = jest.fn(() => second) as any;

      registry.registerTool('brush', FirstTool);
      registry.registerTool('brush', SecondTool);

      expect(registry.getTool('brush')).toBe(second);
    });

    it('should register multiple tools independently', () => {
      const brushInstance = { name: '' };
      const eraserInstance = { name: '' };
      const BrushTool = jest.fn(() => brushInstance) as any;
      const EraserTool = jest.fn(() => eraserInstance) as any;

      registry.registerTool('brush', BrushTool);
      registry.registerTool('eraser', EraserTool);

      expect(registry.getTool('brush')).toBe(brushInstance);
      expect(registry.getTool('eraser')).toBe(eraserInstance);
    });
  });

  describe('getTool', () => {
    it('should return the registered tool instance', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;
      registry.registerTool('selection', MockTool);

      const result = registry.getTool('selection');

      expect(result).toBe(mockInstance);
    });

    it('should return null and warn for an unregistered tool', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      const result = registry.getTool('nonexistent');

      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith('Unknown tool: nonexistent');

      spy.mockRestore();
    });
  });

  describe('hasTool', () => {
    it('should return true for a registered tool', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;
      registry.registerTool('brush', MockTool);

      expect(registry.hasTool('brush')).toBe(true);
    });

    it('should return false for an unregistered tool', () => {
      expect(registry.hasTool('nonexistent')).toBe(false);
    });

    it('should not log any warnings', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      registry.hasTool('missing');

      expect(spy).not.toHaveBeenCalled();
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

      registry.registerTool('brush', BrushTool);
      registry.registerTool('eraser', EraserTool);
      registry.registerTool('selection', SelectionTool);

      expect(registry.getToolByIndex(0)).toBe(brushInstance);
      expect(registry.getToolByIndex(1)).toBe(eraserInstance);
      expect(registry.getToolByIndex(2)).toBe(selectionInstance);
    });

    it('should return null for out-of-bounds index', () => {
      const mockInstance = { name: '' };
      const MockTool = jest.fn(() => mockInstance) as any;
      registry.registerTool('brush', MockTool);

      expect(registry.getToolByIndex(5)).toBeNull();
      expect(registry.getToolByIndex(-1)).toBeNull();
    });
  });

  describe('multi-instance isolation', () => {
    it('should not share registered tools between two registry instances', () => {
      const coreA: any = { id: 'A' };
      const coreB: any = { id: 'B' };
      const registryA = new KritzelToolRegistry(coreA);
      const registryB = new KritzelToolRegistry(coreB);

      const brushA = { name: '' };
      const BrushTool = jest.fn(() => brushA) as any;

      registryA.registerTool('brush', BrushTool);

      expect(registryA.hasTool('brush')).toBe(true);
      expect(registryB.hasTool('brush')).toBe(false);
    });

    it('should create distinct tool instances bound to each registry\'s core', () => {
      const coreA: any = { id: 'A' };
      const coreB: any = { id: 'B' };
      const registryA = new KritzelToolRegistry(coreA);
      const registryB = new KritzelToolRegistry(coreB);

      const instances: Array<{ name: string; core: any }> = [];
      const BrushTool = jest.fn(function (this: any, core: any) {
        this.name = '';
        this.core = core;
        instances.push(this);
      }) as any;

      const toolA = registryA.registerTool('brush', BrushTool) as any;
      const toolB = registryB.registerTool('brush', BrushTool) as any;

      expect(toolA).not.toBe(toolB);
      expect(toolA.core).toBe(coreA);
      expect(toolB.core).toBe(coreB);
    });
  });
});
