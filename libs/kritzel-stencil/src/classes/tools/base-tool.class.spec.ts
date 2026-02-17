import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';

jest.mock('../core/core.class');

describe('KritzelBaseTool', () => {
  let tool: KritzelBaseTool;
  let mockCore: any;

  const createPointerEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      ...overrides,
    } as PointerEvent;
  };

  const createWheelEvent = (overrides: Partial<WheelEvent> = {}): WheelEvent => {
    return {
      deltaX: 0,
      deltaY: 100,
      ...overrides,
    } as WheelEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = {} as jest.Mocked<KritzelCore>;
    tool = new KritzelBaseTool(mockCore);
  });

  describe('constructor', () => {
    it('should set the default name to base-tool', () => {
      expect(tool.name).toBe('base-tool');
    });

    it('should set __class__ to the constructor name', () => {
      expect(tool.__class__).toBe('KritzelBaseTool');
    });
  });

  describe('onActivate', () => {
    it('should not throw when called', () => {
      expect(() => tool.onActivate()).not.toThrow();
    });
  });

  describe('onDeactivate', () => {
    it('should not throw when called', () => {
      expect(() => tool.onDeactivate()).not.toThrow();
    });
  });

  describe('handlePointerDown', () => {
    it('should not throw when called', () => {
      expect(() => tool.handlePointerDown(createPointerEvent())).not.toThrow();
    });
  });

  describe('handlePointerMove', () => {
    it('should not throw when called', () => {
      expect(() => tool.handlePointerMove(createPointerEvent())).not.toThrow();
    });
  });

  describe('handlePointerUp', () => {
    it('should not throw when called', () => {
      expect(() => tool.handlePointerUp(createPointerEvent())).not.toThrow();
    });
  });

  describe('handleWheel', () => {
    it('should not throw when called', () => {
      expect(() => tool.handleWheel(createWheelEvent())).not.toThrow();
    });
  });

  describe('serialize', () => {
    it('should return an object with __class__ and name', () => {
      const result = tool.serialize();

      expect(result).toEqual({
        __class__: 'KritzelBaseTool',
        name: 'base-tool',
      });
    });

    it('should reflect the current __class__ value', () => {
      tool.__class__ = 'CustomTool';
      tool.name = 'custom';

      const result = tool.serialize();

      expect(result).toEqual({
        __class__: 'CustomTool',
        name: 'custom',
      });
    });
  });

  describe('deserialize', () => {
    it('should assign properties from the input object', () => {
      const data = { __class__: 'RestoredTool', name: 'restored' };

      tool.deserialize(data);

      expect(tool.__class__).toBe('RestoredTool');
      expect(tool.name).toBe('restored');
    });

    it('should return itself', () => {
      const result = tool.deserialize({ __class__: 'X', name: 'x' });

      expect(result).toBe(tool);
    });

    it('should handle extra properties', () => {
      tool.deserialize({ __class__: 'A', name: 'a', extra: 42 });

      expect((tool as any).extra).toBe(42);
    });
  });
});
