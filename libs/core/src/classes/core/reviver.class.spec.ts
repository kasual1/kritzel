import { UpmadeReviver } from './reviver.class';
import { UpmadeCore } from './core.class';
import { UpmadePath } from '../objects/path.class';
import { UpmadeLine } from '../objects/line.class';
import { UpmadeText } from '../objects/text.class';
import { UpmadeShape } from '../objects/shape.class';
import { UpmadeImage } from '../objects/image.class';
import { UpmadeDynamicObject } from '../objects/dynamic-object.class';
import { UpmadeIframeObject } from '../objects/iframe.class';
import { UpmadeSelectionGroup } from '../objects/selection-group.class';
import { UpmadeGroup } from '../objects/group.class';
import { UpmadeWorkspace } from './workspace.class';
import { UpmadeBrushTool } from '../tools/brush-tool.class';
import { UpmadeEraserTool } from '../tools/eraser-tool.class';
import { UpmadeImageTool } from '../tools/image-tool.class';
import { UpmadeLineTool } from '../tools/line-tool.class';
import { UpmadeSelectionTool } from '../tools/selection-tool.class';
import { UpmadeTextTool } from '../tools/text-tool.class';
import { UpmadeShapeTool } from '../tools/shape-tool.class';

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
  UpmadeWorkspace: {
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

describe('UpmadeReviver', () => {
  let reviver: UpmadeReviver;
  let mockCore: jest.Mocked<UpmadeCore>;

  const createMockCore = (): jest.Mocked<UpmadeCore> => {
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
    } as unknown as jest.Mocked<UpmadeCore>;
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
    reviver = new UpmadeReviver(mockCore);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a reviver instance with a core reference', () => {
      const reviverInstance = new UpmadeReviver(mockCore);
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

    describe('UpmadePath revival', () => {
      it('should revive an UpmadePath object', () => {
        const mockDeserializable = createMockDeserializable('UpmadePath');
        (UpmadePath.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadePath',
          points: [[0, 0], [50, 50]],
          strokeWidth: 8,
        };

        const result = reviver.revive(serialized);

        expect(UpmadePath.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeLine revival', () => {
      it('should revive an UpmadeLine object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeLine');
        (UpmadeLine.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeLine',
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
        };

        const result = reviver.revive(serialized);

        expect(UpmadeLine.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeText revival', () => {
      it('should revive an UpmadeText object with fontSize and fontFamily', () => {
        const mockDeserializable = createMockDeserializable('UpmadeText');
        (UpmadeText.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeText',
          fontSize: 24,
          fontFamily: 'Arial',
          content: 'Hello',
        };

        const result = reviver.revive(serialized);

        expect(UpmadeText.create).toHaveBeenCalledWith(mockCore, 24, 'Arial');
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeShape revival', () => {
      it('should revive an UpmadeShape object with full config', () => {
        const mockDeserializable = createMockDeserializable('UpmadeShape');
        (UpmadeShape.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeShape',
          shapeType: 'rectangle',
          fillColor: { light: '#ffffff', dark: '#000000' },
          strokeColor: { light: '#000000', dark: '#ffffff' },
          strokeWidth: 2,
          fontSize: 16,
          fontFamily: 'Helvetica',
          fontColor: { light: '#333333', dark: '#cccccc' },
        };

        const result = reviver.revive(serialized);

        expect(UpmadeShape.create).toHaveBeenCalledWith(mockCore, {
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

    describe('UpmadeImage revival', () => {
      it('should revive an UpmadeImage object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeImage');
        (UpmadeImage.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeImage',
          src: 'data:image/png;base64,abc',
        };

        const result = reviver.revive(serialized);

        expect(UpmadeImage.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeDynamicObject revival', () => {
      it('should revive an UpmadeDynamicObject object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeDynamicObject');
        (UpmadeDynamicObject.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeDynamicObject',
          width: 200,
          height: 150,
        };

        const result = reviver.revive(serialized);

        expect(UpmadeDynamicObject.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeIframeObject revival', () => {
      it('should revive an UpmadeIframeObject object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeIframeObject');
        (UpmadeIframeObject.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeIframeObject',
          html: '<main>Embedded</main>',
          state: { ready: true },
        };

        const result = reviver.revive(serialized);

        expect(UpmadeIframeObject.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeSelectionGroup revival', () => {
      it('should revive an UpmadeSelectionGroup object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeSelectionGroup');
        (UpmadeSelectionGroup.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeSelectionGroup',
          childIds: ['id-1', 'id-2'],
        };

        const result = reviver.revive(serialized);

        expect(UpmadeSelectionGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeGroup revival', () => {
      it('should revive an UpmadeGroup object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeGroup');
        (UpmadeGroup.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeGroup',
          childIds: ['id-3', 'id-4'],
        };

        const result = reviver.revive(serialized);

        expect(UpmadeGroup.create).toHaveBeenCalledWith(mockCore);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('UpmadeWorkspace revival', () => {
      it('should revive an UpmadeWorkspace object', () => {
        const mockDeserializable = createMockDeserializable('UpmadeWorkspace');
        (UpmadeWorkspace.create as jest.Mock).mockReturnValue({
          deserialize: mockDeserializable.deserialize,
        });

        const serialized = {
          __class__: 'UpmadeWorkspace',
          id: 'ws-1',
          name: 'Test Workspace',
        };

        const result = reviver.revive(serialized);

        expect(UpmadeWorkspace.create).toHaveBeenCalledWith(mockCore, serialized);
        expect(mockDeserializable.deserialize).toHaveBeenCalledWith(serialized);
        expect(result).toBe(mockDeserializable.instance);
      });
    });

    describe('tool revival', () => {
      it('should revive an UpmadeBrushTool', () => {
        const serialized = { __class__: 'UpmadeBrushTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeBrushTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeBrushTool);
      });

      it('should revive an UpmadeEraserTool', () => {
        const serialized = { __class__: 'UpmadeEraserTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeEraserTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeEraserTool);
      });

      it('should revive an UpmadeImageTool', () => {
        const serialized = { __class__: 'UpmadeImageTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeImageTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeImageTool);
      });

      it('should revive an UpmadeSelectionTool', () => {
        const serialized = { __class__: 'UpmadeSelectionTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeSelectionTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeSelectionTool);
      });

      it('should revive an UpmadeTextTool', () => {
        const serialized = { __class__: 'UpmadeTextTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeTextTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeTextTool);
      });

      it('should revive an UpmadeLineTool', () => {
        const serialized = { __class__: 'UpmadeLineTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeLineTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeLineTool);
      });

      it('should revive an UpmadeShapeTool', () => {
        const serialized = { __class__: 'UpmadeShapeTool' };
        const result = reviver.revive(serialized);

        expect(UpmadeShapeTool).toHaveBeenCalledWith(mockCore);
        expect(result).toBeInstanceOf(UpmadeShapeTool);
      });
    });

    describe('recursive revival', () => {
      it('should revive nested objects with __class__ properties', () => {
        const mockPathDeserializable = createMockDeserializable('UpmadePath');
        (UpmadePath.create as jest.Mock).mockReturnValue({
          deserialize: mockPathDeserializable.deserialize,
        });

        const nested = {
          layer: {
            child: {
              __class__: 'UpmadePath',
              points: [[10, 10]],
            },
          },
        };

        const result = reviver.revive<any>(nested);

        expect(UpmadePath.create).toHaveBeenCalledWith(mockCore);
        expect(result.layer.child).toBe(mockPathDeserializable.instance);
      });

      it('should revive objects inside arrays', () => {
        const mockLineDeserializable = createMockDeserializable('UpmadeLine');
        (UpmadeLine.create as jest.Mock).mockReturnValue({
          deserialize: mockLineDeserializable.deserialize,
        });

        const arr = [
          { __class__: 'UpmadeLine', startX: 0, startY: 0 },
          'plain string',
          42,
        ];

        const result = reviver.revive<any[]>(arr);

        expect(Array.isArray(result)).toBe(true);
        expect(UpmadeLine.create).toHaveBeenCalledWith(mockCore);
        expect(result[0]).toBe(mockLineDeserializable.instance);
        expect(result[1]).toBe('plain string');
        expect(result[2]).toBe(42);
      });

      it('should revive multiple different object types in a nested structure', () => {
        const mockPathDeserializable = createMockDeserializable('UpmadePath');
        const mockImageDeserializable = createMockDeserializable('UpmadeImage');

        (UpmadePath.create as jest.Mock).mockReturnValue({
          deserialize: mockPathDeserializable.deserialize,
        });
        (UpmadeImage.create as jest.Mock).mockReturnValue({
          deserialize: mockImageDeserializable.deserialize,
        });

        const nested = {
          items: [
            { __class__: 'UpmadePath', points: [] },
            { __class__: 'UpmadeImage', src: 'test.png' },
          ],
          metadata: { name: 'test' },
        };

        const result = reviver.revive<any>(nested);

        expect(UpmadePath.create).toHaveBeenCalledWith(mockCore);
        expect(UpmadeImage.create).toHaveBeenCalledWith(mockCore);
        expect(result.items[0]).toBe(mockPathDeserializable.instance);
        expect(result.items[1]).toBe(mockImageDeserializable.instance);
        expect(result.metadata).toEqual({ name: 'test' });
      });
    });
  });

  describe('UpmadeDynamicObject revival with HTML payload', () => {
    it('should revive dynamic object from serialized object', () => {
      const mockDynamicObjectDeserializable = createMockDeserializable('UpmadeDynamicObject');

      (UpmadeDynamicObject.create as jest.Mock).mockReturnValue({
        deserialize: mockDynamicObjectDeserializable.deserialize,
      });

      const serialized = {
        __class__: 'UpmadeDynamicObject',
        htmlString: '<div id="test">Custom Content</div>',
        width: 200,
        height: 100,
        translateX: 10,
        translateY: 20,
      };

      const revived = reviver.revive<UpmadeDynamicObject>(serialized);

      expect(UpmadeDynamicObject.create).toHaveBeenCalledWith(mockCore);
      expect(revived).toBe(mockDynamicObjectDeserializable.instance);
    });

    it('should revive dynamic object with empty htmlString fallback', () => {
      const mockDynamicObjectDeserializable = createMockDeserializable('UpmadeDynamicObject');

      (UpmadeDynamicObject.create as jest.Mock).mockReturnValue({
        deserialize: mockDynamicObjectDeserializable.deserialize,
      });

      const serialized = {
        __class__: 'UpmadeDynamicObject',
        htmlString: '',
        width: 100,
        height: 100,
      };

      const revived = reviver.revive<UpmadeDynamicObject>(serialized);

      expect(UpmadeDynamicObject.create).toHaveBeenCalledWith(mockCore);
      expect(revived).toBe(mockDynamicObjectDeserializable.instance);
    });

  });
});
