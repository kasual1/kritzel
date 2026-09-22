import { KritzelReviver } from './reviver.class';
import { KritzelCore } from './core.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelDynamicObject } from '../objects/dynamic-object.class';
import { KritzelIframeObject } from '../objects/iframe.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelBrushTool } from '../tools/brush-tool.class';
import { KritzelEraserTool } from '../tools/eraser-tool.class';
import { KritzelImageTool } from '../tools/image-tool.class';
import { KritzelLineTool } from '../tools/line-tool.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelShapeTool } from '../tools/shape-tool.class';

jest.mock('../objects/path.class');
jest.mock('../objects/line.class');
jest.mock('../objects/text.class');
jest.mock('../objects/shape.class');
jest.mock('../objects/image.class');
jest.mock('../objects/dynamic-object.class');
jest.mock('../objects/iframe.class');
jest.mock('../objects/selection-group.class');
jest.mock('../objects/group.class');
jest.mock('./workspace.class', () => ({
  KritzelWorkspace: {
    create: jest.fn(),
  },
}));
jest.mock('../tools/brush-tool.class');
jest.mock('../tools/eraser-tool.class');
jest.mock('../tools/image-tool.class');
jest.mock('../tools/line-tool.class');
jest.mock('../tools/selection-tool.class');
jest.mock('../tools/text-tool.class');
jest.mock('../tools/shape-tool.class');

describe('KritzelReviver', () => {
  let reviver: KritzelReviver;
  let mockCore: jest.Mocked<KritzelCore>;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    return {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          objects: {
            update: jest.fn(),
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
        currentZIndex: 1,
      },
      anchorManager: {
        updateAnchorsForObject: jest.fn(),
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  const createMockDeserializable = (className: string) => {
    const instance = { __class__: className, deserialized: true };
    return {
      instance,
      deserialize: jest.fn().mockReturnValue(instance),
    };
  };

  beforeEach(() => {
    mockCore = createMockCore();
    reviver = new KritzelReviver(mockCore);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a reviver instance with a core reference', () => {
      const reviverInstance = new KritzelReviver(mockCore);
      expect(reviverInstance).toBeDefined();
    });
  });

  describe('revive', () => {
    describe('primitive values', () => {
      it('should return null as-is', () => {
        expect(reviver.revive(null)).toBeNull();
      });

      it('should return undefined as-is', () => {
        expect(reviver.revive(undefined)).toBeUndefined();
      });

      it('should return a string as-is', () => {
        expect(reviver.revive('hello')).toBe('hello');
      });

      it('should return a number as-is', () => {
        expect(reviver.revive(42)).toBe(42);
      });

      it('should return a boolean as-is', () => {
        expect(reviver.revive(true)).toBe(true);
        expect(reviver.revive(false)).toBe(false);
      });
    });

    describe('plain objects without __class__', () => {
      it('should return a shallow copy of a plain object', () => {
        const obj = { x: 1, y: 2, name: 'test' };
        const result = reviver.revive(obj);
        expect(result).toEqual({ x: 1, y: 2, name: 'test' });
      });

      it('should recursively process nested plain objects', () => {
        const obj = { outer: { inner: 'value' } };
        const result = reviver.revive<any>(obj);
        expect(result.outer).toEqual({ inner: 'value' });
      });

      it('should handle empty objects', () => {
        expect(reviver.revive({})).toEqual({});
      });
    });

    describe('arrays', () => {
      it('should recursively process array elements', () => {
        const arr = [1, 'two', { key: 'val' }];
        const result = reviver.revive<any[]>(arr);
        expect(result).toEqual([1, 'two', { key: 'val' }]);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle empty arrays', () => {
        const result = reviver.revive<any[]>([]);
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('unknown __class__', () => {
      it('should return the original object for an unknown __class__', () => {
        const obj = { __class__: 'UnknownClass', data: 123 };
        const result = reviver.revive(obj);
        expect(result).toBe(obj);
      });
    });

    describe('KritzelPath revival', () => {
      it('should revive a KritzelPath object', () => {
        const mockDeserializable = createMockDeserializable('KritzelPath');
        (KritzelPath.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelPath',
          points: [[0, 0], [50, 50]],
          strokeWidth: 8,
        };

        const result = reviver.revive(serialized);

        expect(KritzelPath.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelLine revival', () => {
      it('should revive a KritzelLine object', () => {
        const mockDeserializable = createMockDeserializable('KritzelLine');
        (KritzelLine.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelLine',
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
        };

        const result = reviver.revive(serialized);

        expect(KritzelLine.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelText revival', () => {
      it('should revive a KritzelText object with fontSize and fontFamily', () => {
        const mockDeserializable = createMockDeserializable('KritzelText');
        (KritzelText.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelText',
          fontSize: 24,
          fontFamily: 'Arial',
          content: 'Hello',
        };

        const result = reviver.revive(serialized);

        expect(KritzelText.create).toHaveBeenCalledWith(mockCore, 24, 'Arial');
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelShape revival', () => {
      it('should revive a KritzelShape object with full config', () => {
        const mockDeserializable = createMockDeserializable('KritzelShape');
        (KritzelShape.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelShape',
          shapeType: 'rectangle',
          fillColor: { light: '#ffffff', dark: '#000000' },
          strokeColor: { light: '#000000', dark: '#ffffff' },
          strokeWidth: 2,
          fontSize: 16,
          fontFamily: 'Helvetica',
          fontColor: { light: '#333333', dark: '#cccccc' },
        };

        const result = reviver.revive(serialized);

        expect(KritzelShape.create).toHaveBeenCalledWith(mockCore, {
          shapeType: 'rectangle',
          fillColor: { light: '#ffffff', dark: '#000000' },
          strokeColor: { light: '#000000', dark: '#ffffff' },
          strokeWidth: 2,
          fontSize: 16,
          fontFamily: 'Helvetica',
          fontColor: { light: '#333333', dark: '#cccccc' },
        });
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelImage revival', () => {
      it('should revive a KritzelImage object', () => {
        const mockDeserializable = createMockDeserializable('KritzelImage');
        (KritzelImage.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelImage',
          src: 'data:image/png;base64,abc',
        };

        const result = reviver.revive(serialized);

        expect(KritzelImage.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelDynamicObject revival', () => {
      it('should revive a KritzelDynamicObject object', () => {
        const mockDeserializable = createMockDeserializable('KritzelDynamicObject');
        (KritzelDynamicObject.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelDynamicObject',
          width: 200,
          height: 150,
        };

        const result = reviver.revive(serialized);

        expect(KritzelDynamicObject.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelIframeObject revival', () => {
      it('should revive a KritzelIframeObject object', () => {
        const mockDeserializable = createMockDeserializable('KritzelIframeObject');
        (KritzelIframeObject.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelIframeObject',
          html: '<main>Embedded</main>',
          state: { ready: true },
        };

        const result = reviver.revive(serialized);

        expect(KritzelIframeObject.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelSelectionGroup revival', () => {
      it('should revive a KritzelSelectionGroup object', () => {
        const mockDeserializable = createMockDeserializable('KritzelSelectionGroup');
        (KritzelSelectionGroup.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelSelectionGroup',
          childIds: ['id-1', 'id-2'],
        };

        const result = reviver.revive(serialized);

        expect(KritzelSelectionGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelGroup revival', () => {
      it('should revive a KritzelGroup object', () => {
        const mockDeserializable = createMockDeserializable('KritzelGroup');
        (KritzelGroup.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelGroup',
          childIds: ['id-3', 'id-4'],
        };

        const result = reviver.revive(serialized);

        expect(KritzelGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('KritzelWorkspace revival', () => {
      it('should revive a KritzelWorkspace object', () => {
        const mockDeserializable = createMockDeserializable('KritzelWorkspace');
        (KritzelWorkspace.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'KritzelWorkspace',
          id: 'ws-1',
          name: 'Test Workspace',
        };

        const result = reviver.revive(serialized);

        expect(KritzelWorkspace.create).toHaveBeenCalledWith(mockCore, serialized);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('tool revival', () => {
      it('should revive a KritzelBrushTool', () => {
        const serialized = { __class__: 'KritzelBrushTool' };
        const result = reviver.revive(serialized);

        expect(KritzelBrushTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelBrushTool);
      });

      it('should revive a KritzelEraserTool', () => {
        const serialized = { __class__: 'KritzelEraserTool' };
        const result = reviver.revive(serialized);

        expect(KritzelEraserTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelEraserTool);
      });

      it('should revive a KritzelImageTool', () => {
        const serialized = { __class__: 'KritzelImageTool' };
        const result = reviver.revive(serialized);

        expect(KritzelImageTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelImageTool);
      });

      it('should revive a KritzelSelectionTool', () => {
        const serialized = { __class__: 'KritzelSelectionTool' };
        const result = reviver.revive(serialized);

        expect(KritzelSelectionTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelSelectionTool);
      });

      it('should revive a KritzelTextTool', () => {
        const serialized = { __class__: 'KritzelTextTool' };
        const result = reviver.revive(serialized);

        expect(KritzelTextTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelTextTool);
      });

      it('should revive a KritzelLineTool', () => {
        const serialized = { __class__: 'KritzelLineTool' };
        const result = reviver.revive(serialized);

        expect(KritzelLineTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelLineTool);
      });

      it('should revive a KritzelShapeTool', () => {
        const serialized = { __class__: 'KritzelShapeTool' };
        const result = reviver.revive(serialized);

        expect(KritzelShapeTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(KritzelShapeTool);
      });
    });

    describe('recursive revival', () => {
      it('should revive nested objects with __class__ properties', () => {
        const mockPathDeserializable = createMockDeserializable('KritzelPath');
        (KritzelPath.create as jest.Mock).mockReturnValue({
          deserialize: mockPathDeserializable.deserialize,
        });

        const nested = {
          layer: {
            child: {
              __class__: 'KritzelPath',
              points: [[10, 10]],
            },
          },
        };

        const result = reviver.revive<any>(nested);

        expect(KritzelPath.create).toHaveBeenCalledWith(mockCore);
        expect(result.layer.child).toBe(mockPathDeserializable.instance);
      });

      it('should revive objects inside arrays', () => {
        const mockLineDeserializable = createMockDeserializable('KritzelLine');
        (KritzelLine.create as jest.Mock).mockReturnValue({
          deserialize: mockLineDeserializable.deserialize,
        });

        const arr = [
          { __class__: 'KritzelLine', startX: 0, startY: 0 },
          'plain string',
          42,
        ];

        const result = reviver.revive<any[]>(arr);

        expect(Array.isArray(result)).toBe(true);
        expect(KritzelLine.create).toHaveBeenCalledWith(mockCore);
        expect(result[0]).toBe(mockLineDeserializable.instance);
        expect(result[1]).toBe('plain string');
        expect(result[2]).toBe(42);
      });

      it('should revive multiple different object types in a nested structure', () => {
        const mockPathDeserializable = createMockDeserializable('KritzelPath');
        const mockImageDeserializable = createMockDeserializable('KritzelImage');

        (KritzelPath.create as jest.Mock).mockReturnValue({
          deserialize: mockPathDeserializable.deserialize,
        });
        (KritzelImage.create as jest.Mock).mockReturnValue({
          deserialize: mockImageDeserializable.deserialize,
        });

        const nested = {
          items: [
            { __class__: 'KritzelPath', points: [] },
            { __class__: 'KritzelImage', src: 'test.png' },
          ],
          metadata: { name: 'test' },
        };

        const result = reviver.revive<any>(nested);

        expect(KritzelPath.create).toHaveBeenCalledWith(mockCore);
        expect(KritzelImage.create).toHaveBeenCalledWith(mockCore);
        expect(result.items[0]).toBe(mockPathDeserializable.instance);
        expect(result.items[1]).toBe(mockImageDeserializable.instance);
        expect(result.metadata).toEqual({ name: 'test' });
      });
    });
  });

  describe('KritzelDynamicObject revival with HTML payload', () => {
    it('should revive dynamic object from serialized object', () => {
      const mockDynamicObjectDeserializable = createMockDeserializable('KritzelDynamicObject');

      (KritzelDynamicObject.create as jest.Mock).mockReturnValue({
        deserialize: mockDynamicObjectDeserializable.deserialize,
      });

      const serialized = {
        __class__: 'KritzelDynamicObject',
        htmlString: '<div id="test">Custom Content</div>',
        width: 200,
        height: 100,
        translateX: 10,
        translateY: 20,
      };

      const revived = reviver.revive<KritzelDynamicObject>(serialized);

      expect(KritzelDynamicObject.create).toHaveBeenCalledWith(mockCore);
      expect(revived).toBe(mockDynamicObjectDeserializable.instance);
    });

    it('should revive dynamic object with empty htmlString fallback', () => {
      const mockDynamicObjectDeserializable = createMockDeserializable('KritzelDynamicObject');

      (KritzelDynamicObject.create as jest.Mock).mockReturnValue({
        deserialize: mockDynamicObjectDeserializable.deserialize,
      });

      const serialized = {
        __class__: 'KritzelDynamicObject',
        htmlString: '',
        width: 100,
        height: 100,
      };

      const revived = reviver.revive<KritzelDynamicObject>(serialized);

      expect(KritzelDynamicObject.create).toHaveBeenCalledWith(mockCore);
      expect(revived).toBe(mockDynamicObjectDeserializable.instance);
    });

  });
});
