import { UpdrawReviver } from './reviver.class';
import { UpdrawCore } from './core.class';
import { UpdrawPath } from '../objects/path.class';
import { UpdrawLine } from '../objects/line.class';
import { UpdrawText } from '../objects/text.class';
import { UpdrawShape } from '../objects/shape.class';
import { UpdrawImage } from '../objects/image.class';
import { UpdrawDynamicObject } from '../objects/dynamic-object.class';
import { UpdrawIframeObject } from '../objects/iframe.class';
import { UpdrawSelectionGroup } from '../objects/selection-group.class';
import { UpdrawGroup } from '../objects/group.class';
import { UpdrawWorkspace } from './workspace.class';
import { UpdrawBrushTool } from '../tools/brush-tool.class';
import { UpdrawEraserTool } from '../tools/eraser-tool.class';
import { UpdrawImageTool } from '../tools/image-tool.class';
import { UpdrawLineTool } from '../tools/line-tool.class';
import { UpdrawSelectionTool } from '../tools/selection-tool.class';
import { UpdrawTextTool } from '../tools/text-tool.class';
import { UpdrawShapeTool } from '../tools/shape-tool.class';

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
  UpdrawWorkspace: {
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

describe('UpdrawReviver', () => {
  let reviver: UpdrawReviver;
  let mockCore: jest.Mocked<UpdrawCore>;

  const createMockCore = (): jest.Mocked<UpdrawCore> => {
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
    } as unknown as jest.Mocked<UpdrawCore>;
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
    reviver = new UpdrawReviver(mockCore);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a reviver instance with a core reference', () => {
      const reviverInstance = new UpdrawReviver(mockCore);
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

    describe('UpdrawPath revival', () => {
      it('should revive an UpdrawPath object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawPath');
        (UpdrawPath.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawPath',
          points: [[0, 0], [50, 50]],
          strokeWidth: 8,
        };

        const result = reviver.revive(serialized);

        expect(UpdrawPath.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawLine revival', () => {
      it('should revive an UpdrawLine object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawLine');
        (UpdrawLine.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawLine',
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
        };

        const result = reviver.revive(serialized);

        expect(UpdrawLine.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawText revival', () => {
      it('should revive an UpdrawText object with fontSize and fontFamily', () => {
        const mockDeserializable = createMockDeserializable('UpdrawText');
        (UpdrawText.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawText',
          fontSize: 24,
          fontFamily: 'Arial',
          content: 'Hello',
        };

        const result = reviver.revive(serialized);

        expect(UpdrawText.create).toHaveBeenCalledWith(mockCore, 24, 'Arial');
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawShape revival', () => {
      it('should revive an UpdrawShape object with full config', () => {
        const mockDeserializable = createMockDeserializable('UpdrawShape');
        (UpdrawShape.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawShape',
          shapeType: 'rectangle',
          fillColor: { light: '#ffffff', dark: '#000000' },
          strokeColor: { light: '#000000', dark: '#ffffff' },
          strokeWidth: 2,
          fontSize: 16,
          fontFamily: 'Helvetica',
          fontColor: { light: '#333333', dark: '#cccccc' },
        };

        const result = reviver.revive(serialized);

        expect(UpdrawShape.create).toHaveBeenCalledWith(mockCore, {
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

    describe('UpdrawImage revival', () => {
      it('should revive an UpdrawImage object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawImage');
        (UpdrawImage.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawImage',
          src: 'data:image/png;base64,abc',
        };

        const result = reviver.revive(serialized);

        expect(UpdrawImage.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawDynamicObject revival', () => {
      it('should revive an UpdrawDynamicObject object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawDynamicObject');
        (UpdrawDynamicObject.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawDynamicObject',
          width: 200,
          height: 150,
        };

        const result = reviver.revive(serialized);

        expect(UpdrawDynamicObject.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawIframeObject revival', () => {
      it('should revive an UpdrawIframeObject object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawIframeObject');
        (UpdrawIframeObject.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawIframeObject',
          html: '<main>Embedded</main>',
          state: { ready: true },
        };

        const result = reviver.revive(serialized);

        expect(UpdrawIframeObject.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawSelectionGroup revival', () => {
      it('should revive an UpdrawSelectionGroup object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawSelectionGroup');
        (UpdrawSelectionGroup.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawSelectionGroup',
          childIds: ['id-1', 'id-2'],
        };

        const result = reviver.revive(serialized);

        expect(UpdrawSelectionGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawGroup revival', () => {
      it('should revive an UpdrawGroup object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawGroup');
        (UpdrawGroup.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawGroup',
          childIds: ['id-3', 'id-4'],
        };

        const result = reviver.revive(serialized);

        expect(UpdrawGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpdrawWorkspace revival', () => {
      it('should revive an UpdrawWorkspace object', () => {
        const mockDeserializable = createMockDeserializable('UpdrawWorkspace');
        (UpdrawWorkspace.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpdrawWorkspace',
          id: 'ws-1',
          name: 'Test Workspace',
        };

        const result = reviver.revive(serialized);

        expect(UpdrawWorkspace.create).toHaveBeenCalledWith(mockCore, serialized);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('tool revival', () => {
      it('should revive an UpdrawBrushTool', () => {
        const serialized = { __class__: 'UpdrawBrushTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawBrushTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawBrushTool);
      });

      it('should revive an UpdrawEraserTool', () => {
        const serialized = { __class__: 'UpdrawEraserTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawEraserTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawEraserTool);
      });

      it('should revive an UpdrawImageTool', () => {
        const serialized = { __class__: 'UpdrawImageTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawImageTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawImageTool);
      });

      it('should revive an UpdrawSelectionTool', () => {
        const serialized = { __class__: 'UpdrawSelectionTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawSelectionTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawSelectionTool);
      });

      it('should revive an UpdrawTextTool', () => {
        const serialized = { __class__: 'UpdrawTextTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawTextTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawTextTool);
      });

      it('should revive an UpdrawLineTool', () => {
        const serialized = { __class__: 'UpdrawLineTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawLineTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawLineTool);
      });

      it('should revive an UpdrawShapeTool', () => {
        const serialized = { __class__: 'UpdrawShapeTool' };
        const result = reviver.revive(serialized);

        expect(UpdrawShapeTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpdrawShapeTool);
      });
    });

    describe('recursive revival', () => {
      it('should revive nested objects with __class__ properties', () => {
        const mockPathDeserializable = createMockDeserializable('UpdrawPath');
        (UpdrawPath.create as jest.Mock).mockReturnValue({
          deserialize: mockPathDeserializable.deserialize,
        });

        const nested = {
          layer: {
            child: {
              __class__: 'UpdrawPath',
              points: [[10, 10]],
            },
          },
        };

        const result = reviver.revive<any>(nested);

        expect(UpdrawPath.create).toHaveBeenCalledWith(mockCore);
        expect(result.layer.child).toBe(mockPathDeserializable.instance);
      });

      it('should revive objects inside arrays', () => {
        const mockLineDeserializable = createMockDeserializable('UpdrawLine');
        (UpdrawLine.create as jest.Mock).mockReturnValue({
          deserialize: mockLineDeserializable.deserialize,
        });

        const arr = [
          { __class__: 'UpdrawLine', startX: 0, startY: 0 },
          'plain string',
          42,
        ];

        const result = reviver.revive<any[]>(arr);

        expect(Array.isArray(result)).toBe(true);
        expect(UpdrawLine.create).toHaveBeenCalledWith(mockCore);
        expect(result[0]).toBe(mockLineDeserializable.instance);
        expect(result[1]).toBe('plain string');
        expect(result[2]).toBe(42);
      });

      it('should revive multiple different object types in a nested structure', () => {
        const mockPathDeserializable = createMockDeserializable('UpdrawPath');
        const mockImageDeserializable = createMockDeserializable('UpdrawImage');

        (UpdrawPath.create as jest.Mock).mockReturnValue({
          deserialize: mockPathDeserializable.deserialize,
        });
        (UpdrawImage.create as jest.Mock).mockReturnValue({
          deserialize: mockImageDeserializable.deserialize,
        });

        const nested = {
          items: [
            { __class__: 'UpdrawPath', points: [] },
            { __class__: 'UpdrawImage', src: 'test.png' },
          ],
          metadata: { name: 'test' },
        };

        const result = reviver.revive<any>(nested);

        expect(UpdrawPath.create).toHaveBeenCalledWith(mockCore);
        expect(UpdrawImage.create).toHaveBeenCalledWith(mockCore);
        expect(result.items[0]).toBe(mockPathDeserializable.instance);
        expect(result.items[1]).toBe(mockImageDeserializable.instance);
        expect(result.metadata).toEqual({ name: 'test' });
      });
    });
  });

  describe('UpdrawDynamicObject revival with HTML payload', () => {
    it('should revive dynamic object from serialized object', () => {
      const mockDynamicObjectDeserializable = createMockDeserializable('UpdrawDynamicObject');

      (UpdrawDynamicObject.create as jest.Mock).mockReturnValue({
        deserialize: mockDynamicObjectDeserializable.deserialize,
      });

      const serialized = {
        __class__: 'UpdrawDynamicObject',
        htmlString: '<div id="test">Custom Content</div>',
        width: 200,
        height: 100,
        translateX: 10,
        translateY: 20,
      };

      const revived = reviver.revive<UpdrawDynamicObject>(serialized);

      expect(UpdrawDynamicObject.create).toHaveBeenCalledWith(mockCore);
      expect(revived).toBe(mockDynamicObjectDeserializable.instance);
    });

    it('should revive dynamic object with empty htmlString fallback', () => {
      const mockDynamicObjectDeserializable = createMockDeserializable('UpdrawDynamicObject');

      (UpdrawDynamicObject.create as jest.Mock).mockReturnValue({
        deserialize: mockDynamicObjectDeserializable.deserialize,
      });

      const serialized = {
        __class__: 'UpdrawDynamicObject',
        htmlString: '',
        width: 100,
        height: 100,
      };

      const revived = reviver.revive<UpdrawDynamicObject>(serialized);

      expect(UpdrawDynamicObject.create).toHaveBeenCalledWith(mockCore);
      expect(revived).toBe(mockDynamicObjectDeserializable.instance);
    });

  });
});
