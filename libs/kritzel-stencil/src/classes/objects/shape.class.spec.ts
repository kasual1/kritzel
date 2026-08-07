import { KritzelShape } from './shape.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { KritzelDevicesHelper } from '../../helpers/devices.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { ShapeType } from '../../enums/shape-type.enum';

// Mock prosemirror modules
jest.mock('prosemirror-state', () => ({
  EditorState: {
    create: jest.fn(() => ({
      doc: {
        content: { size: 10 },
        textContent: 'test content',
        toJSON: jest.fn(() => ({ type: 'doc', content: [] })),
      },
      tr: {
        replaceWith: jest.fn().mockReturnThis(),
        setSelection: jest.fn().mockReturnThis(),
        setMeta: jest.fn().mockReturnThis(),
        getMeta: jest.fn(() => false),
        docChanged: false,
      },
      schema: {
        nodeFromJSON: jest.fn(() => ({ content: {} })),
      },
      apply: jest.fn(function () {
        return this;
      }),
    })),
  },
  TextSelection: {
    create: jest.fn(() => ({})),
  },
}));

jest.mock('prosemirror-view', () => ({
  EditorView: jest.fn().mockImplementation((_element, _options) => {
    const mockDom = document.createElement('div');
    mockDom.classList.add('ProseMirror');
    return {
      dom: mockDom,
      state: {
        doc: {
          content: { size: 10 },
          textContent: 'test content',
          toJSON: jest.fn(() => ({ type: 'doc', content: [] })),
        },
        tr: {
          replaceWith: jest.fn().mockReturnThis(),
          setSelection: jest.fn().mockReturnThis(),
          setMeta: jest.fn().mockReturnThis(),
          getMeta: jest.fn(() => false),
        },
        schema: {
          nodeFromJSON: jest.fn(() => ({ content: {} })),
        },
        apply: jest.fn(function () {
          return this;
        }),
      },
      updateState: jest.fn(),
      dispatch: jest.fn(),
      focus: jest.fn(),
      setProps: jest.fn(),
      posAtCoords: jest.fn(() => ({ pos: 5 })),
      destroy: jest.fn(),
    };
  }),
}));

jest.mock('prosemirror-model', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    node: jest.fn(() => ({})),
    spec: { nodes: {}, marks: {} },
  })),
}));

jest.mock('prosemirror-schema-basic', () => ({
  schema: { spec: { nodes: {}, marks: {} } },
}));

jest.mock('prosemirror-schema-list', () => ({
  addListNodes: jest.fn(() => ({})),
}));

jest.mock('prosemirror-keymap', () => ({
  keymap: jest.fn(() => ({})),
}));

jest.mock('prosemirror-commands', () => ({
  baseKeymap: {},
}));

jest.mock('../../helpers/keyboard.helper', () => ({
  KritzelKeyboardHelper: {
    disableInteractiveWidget: jest.fn(),
    enableInteractiveWidget: jest.fn(),
    forceHideKeyboard: jest.fn(),
  },
}));

jest.mock('../../helpers/devices.helper', () => ({
  KritzelDevicesHelper: {
    isIOS: jest.fn(() => false),
    isTouchDevice: jest.fn(() => false),
  },
}));

jest.mock('../../helpers/geometry.helper', () => ({
  KritzelGeometryHelper: {
    getEllipsePolygonApproximation: jest.fn(() => [
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
      { x: 50, y: 0 },
    ]),
  },
}));

describe('KritzelShape', () => {
  let shapeObject: KritzelShape;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;
  let mockObjectsConsolidate: jest.Mock;
  let mockRerender: jest.Mock;
  let mockEmitObjectsChange: jest.Mock;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    const objectsUpdate = jest.fn();
    const objectsConsolidate = jest.fn();
    const rerender = jest.fn();
    const emitObjectsChange = jest.fn();

    mockObjectsUpdate = objectsUpdate;
    mockObjectsConsolidate = objectsConsolidate;
    mockRerender = rerender;
    mockEmitObjectsChange = emitObjectsChange;

    return {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          objects: {
            update: objectsUpdate,
            consolidateTemporaryItems: objectsConsolidate,
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
          pointers: new Map(),
        },
        get objects() { return this.state.objects; },
        currentZIndex: 1,
        setState: jest.fn(),
      },
      anchorManager: {
        updateAnchorsForObject: jest.fn(),
      },
      rerender: rerender,
      themeManager: {
        currentTheme: 'light',
      },
      engine: {
        emitObjectsChange: emitObjectsChange,
      },
      toolRegistry: {
        getTool: jest.fn(() => ({ name: 'shape' })),
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  beforeEach(() => {
    mockCore = createMockCore();

    shapeObject = KritzelShape.create(mockCore, {
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#ffffff', dark: '#ffffff' },
      strokeColor: { light: '#000000', dark: '#000000' },
      strokeWidth: 4,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a shape with default values when no config provided', () => {
      const defaultShape = new KritzelShape();

      expect(defaultShape.shapeType).toBe(ShapeType.Rectangle);
      expect(defaultShape.fillColor).toEqual({ light: 'transparent', dark: 'transparent' });
      expect(defaultShape.strokeColor).toEqual({ light: '#000000', dark: '#ffffff' });
      expect(defaultShape.strokeWidth).toBe(4);
      expect(defaultShape.fontFamily).toBe('Arial');
      expect(defaultShape.fontSize).toBe(16);
      expect(defaultShape.fontColor).toEqual({ light: '#000000', dark: '#ffffff' });
      expect(defaultShape.x).toBe(0);
      expect(defaultShape.y).toBe(0);
      expect(defaultShape.scale).toBe(1);
      expect(defaultShape.scaleFactor).toBe(1);
      expect(defaultShape.__class__).toBe('KritzelShape');
    });

    it('should create a shape with provided config values', () => {
      const configuredShape = new KritzelShape({
        x: 50,
        y: 100,
        width: 200,
        height: 150,
        shapeType: ShapeType.Ellipse,
        fillColor: { light: '#ff0000', dark: '#ff0000' },
        strokeColor: { light: '#00ff00', dark: '#00ff00' },
        strokeWidth: 8,
        fontSize: 24,
        fontFamily: 'Helvetica',
        fontColor: { light: '#0000ff', dark: '#0000ff' },
        scale: 2,
      });

      expect(configuredShape.x).toBe(50);
      expect(configuredShape.y).toBe(100);
      expect(configuredShape.width).toBe(200);
      expect(configuredShape.height).toBe(150);
      expect(configuredShape.shapeType).toBe(ShapeType.Ellipse);
      expect(configuredShape.fillColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(configuredShape.strokeColor).toEqual({ light: '#00ff00', dark: '#00ff00' });
      expect(configuredShape.strokeWidth).toBe(8);
      expect(configuredShape.fontSize).toBe(24);
      expect(configuredShape.fontFamily).toBe('Helvetica');
      expect(configuredShape.fontColor).toEqual({ light: '#0000ff', dark: '#0000ff' });
      expect(configuredShape.scale).toBe(2);
    });

    it('should set default property values', () => {
      expect(shapeObject.isDebugInfoVisible).toBe(true);
      expect(shapeObject.isEditable).toBe(true);
      expect(shapeObject.isEditing).toBe(false);
      expect(shapeObject.content).toBeNull();
      expect(shapeObject.uneditedObject).toBeNull();
    });

    it('should convert constructor rotation from degrees to radians', () => {
      const configuredShape = new KritzelShape({
        rotation: -90,
      });

      expect(configuredShape.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('static create', () => {
    it('should create a shape with core reference and workspace id', () => {
      const createdShape = KritzelShape.create(mockCore, {
        shapeType: ShapeType.Triangle,
        fillColor: { light: '#00ff00', dark: '#00ff00' },
      });

      expect(createdShape._core).toBe(mockCore);
      expect(createdShape.workspaceId).toBe('workspace-1');
      expect(createdShape.zIndex).toBe(1);
      expect(createdShape.shapeType).toBe(ShapeType.Triangle);
      expect(createdShape.fillColor).toEqual({ light: '#00ff00', dark: '#00ff00' });
    });

    it('should generate a unique id', () => {
      const shape1 = KritzelShape.create(mockCore);
      const shape2 = KritzelShape.create(mockCore);

      expect(shape1.id).toBeDefined();
      expect(shape2.id).toBeDefined();
      expect(shape1.id).not.toBe(shape2.id);
    });

    it('should set transparent background', () => {
      const createdShape = KritzelShape.create(mockCore);

      expect(createdShape.backgroundColor).toEqual({ light: 'transparent', dark: 'transparent' });
    });

    it('should create an editor', () => {
      const createdShape = KritzelShape.create(mockCore);

      expect(createdShape.editor).toBeDefined();
    });

    it('should use default values when not provided', () => {
      const createdShape = KritzelShape.create(mockCore);

      expect(createdShape.x).toBe(0);
      expect(createdShape.y).toBe(0);
      expect(createdShape.width).toBe(100);
      expect(createdShape.height).toBe(100);
      expect(createdShape.shapeType).toBe(ShapeType.Rectangle);
      expect(createdShape.fillColor).toEqual({ light: 'transparent', dark: 'transparent' });
      expect(createdShape.strokeColor).toEqual({ light: '#000000', dark: '#ffffff' });
      expect(createdShape.strokeWidth).toBe(4);
    });

    it('should convert create rotation from degrees to radians', () => {
      const createdShape = KritzelShape.create(mockCore, {
        rotation: -90,
      });

      expect(createdShape.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('viewBox getter', () => {
    it('should return correct viewBox string', () => {
      shapeObject.x = 10;
      shapeObject.y = 20;
      shapeObject.width = 100;
      shapeObject.height = 50;

      expect(shapeObject.viewBox).toBe('10 20 100 50');
    });

    it('should handle zero values', () => {
      shapeObject.x = 0;
      shapeObject.y = 0;
      shapeObject.width = 0;
      shapeObject.height = 0;

      expect(shapeObject.viewBox).toBe('0 0 0 0');
    });
  });

  describe('updateDimensions', () => {
    it('should calculate world coordinates from screen-space', () => {
      shapeObject.x = 100;
      shapeObject.y = 200;
      shapeObject.translateX = -50;
      shapeObject.translateY = -100;
      shapeObject.scale = 2;

      shapeObject.updateDimensions();

      expect(shapeObject.translateX).toBe(25); // (100 + -50) / 2
      expect(shapeObject.translateY).toBe(50); // (200 + -100) / 2
    });

    it('should handle scale of 1', () => {
      shapeObject.x = 100;
      shapeObject.y = 200;
      shapeObject.translateX = 0;
      shapeObject.translateY = 0;
      shapeObject.scale = 1;

      shapeObject.updateDimensions();

      expect(shapeObject.translateX).toBe(100);
      expect(shapeObject.translateY).toBe(200);
    });
  });

  describe('mount', () => {
    it('should set elementRef and isMounted to true', () => {
      shapeObject.isMounted = false;
      const mockElement = document.createElement('div');

      jest.spyOn(shapeObject, 'isInViewport').mockReturnValue(true);

      shapeObject.mount(mockElement);

      expect(shapeObject.elementRef).toBe(mockElement);
      expect(shapeObject.isMounted).toBe(true);
    });

    it('should not mount if element is null', () => {
      shapeObject.isMounted = false;
      shapeObject.mount(null as unknown as HTMLDivElement);

      expect(shapeObject.isMounted).toBe(false);
    });

    it('should not mount if not in viewport', () => {
      shapeObject.isMounted = false;
      const mockElement = document.createElement('div');

      jest.spyOn(shapeObject, 'isInViewport').mockReturnValue(false);

      shapeObject.mount(mockElement);

      expect(shapeObject.isMounted).toBe(false);
    });

    it('should not remount if already mounted with same element', () => {
      const mockElement = document.createElement('div');
      jest.spyOn(shapeObject, 'isInViewport').mockReturnValue(true);

      shapeObject.mount(mockElement);
      shapeObject.isMounted = true;

      const initialMountState = shapeObject.isMounted;
      shapeObject.mount(mockElement);

      expect(shapeObject.isMounted).toBe(initialMountState);
    });
  });

  describe('mountTextEditor', () => {
    it('should apply font styles to element', () => {
      const mockElement = document.createElement('div');

      shapeObject.mountTextEditor(mockElement);

      expect(mockElement.style.fontFamily).toBe('Arial');
      expect(mockElement.style.fontSize).toBe('16pt');
      expect(mockElement.style.color).toBe('#000000');
      expect(mockElement.style.whiteSpace).toBe('pre-wrap');
      expect(mockElement.style.wordWrap).toBe('break-word');
    });

    it('should resolve font color using the current core theme', () => {
      const mockElement = document.createElement('div');
      shapeObject.fontColor = { light: '#111111', dark: '#eeeeee' };
      Object.defineProperty(mockCore.themeManager, 'currentTheme', { value: 'dark', configurable: true });

      shapeObject.mountTextEditor(mockElement);

      expect(mockElement.style.color).toBe('#eeeeee');
    });

    it('should append editor dom to element', () => {
      const mockElement = document.createElement('div');

      shapeObject.mountTextEditor(mockElement);

      expect(mockElement.children.length).toBe(1);
      expect(mockElement.children[0]).toBe(shapeObject.editor?.dom);
    });

    it('should not mount if element is null', () => {
      expect(() => {
        shapeObject.mountTextEditor(null as unknown as HTMLDivElement);
      }).not.toThrow();
    });

    it('should not remount if editor is already in element', () => {
      const mockElement = document.createElement('div');

      shapeObject.mountTextEditor(mockElement);
      const appendChildSpy = jest.spyOn(mockElement, 'appendChild');

      shapeObject.mountTextEditor(mockElement);

      expect(appendChildSpy).not.toHaveBeenCalled();
    });
  });

  describe('setContent', () => {
    it('should set content property', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      shapeObject.setContent(content);

      expect(shapeObject.content).toEqual(content);
    });

    it('should dispatch transaction to editor when content is provided', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      shapeObject.setContent(content);

      expect(shapeObject.editor?.dispatch).toHaveBeenCalled();
    });

    it('should not dispatch if content is null', () => {
      shapeObject.setContent(null);

      expect(shapeObject.editor?.dispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch if editor is null', () => {
      shapeObject.editor = null;
      const content = { type: 'doc', content: [] };

      expect(() => shapeObject.setContent(content)).not.toThrow();
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      shapeObject.width = 100;
      shapeObject.height = 50;
    });

    it('should update position and dimensions', () => {
      shapeObject.resize(50, 75, 200, 100);

      expect(shapeObject.translateX).toBe(50);
      expect(shapeObject.translateY).toBe(75);
      expect(shapeObject.width).toBe(200);
      expect(shapeObject.height).toBe(100);
    });

    it('should not resize if width is less than or equal to 1', () => {
      const originalWidth = shapeObject.width;

      shapeObject.resize(0, 0, 0.5, 100);

      expect(shapeObject.width).toBe(originalWidth);
    });

    it('should not resize if height is less than or equal to 1', () => {
      const originalHeight = shapeObject.height;

      shapeObject.resize(0, 0, 200, 0.5);

      expect(shapeObject.height).toBe(originalHeight);
    });

    it('should call objects.update after resizing', () => {
      shapeObject.resize(0, 0, 200, 100);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(shapeObject);
    });
  });

  describe('focus', () => {
    it('should dispatch selection and focus editor', () => {
      shapeObject.focus();

      expect(shapeObject.editor?.dispatch).toHaveBeenCalled();
      expect(shapeObject.editor?.focus).toHaveBeenCalled();
    });

    it('should use coordinates when provided', () => {
      shapeObject.focus({ x: 100, y: 200 });

      expect(shapeObject.editor?.posAtCoords).toHaveBeenCalledWith({ left: 100, top: 200 });
      expect(shapeObject.editor?.focus).toHaveBeenCalled();
    });

    it('should accept zero coordinates when provided', () => {
      shapeObject.focus({ x: 0, y: 0 });

      expect(shapeObject.editor?.posAtCoords).toHaveBeenCalledWith({ left: 0, top: 0 });
      expect(shapeObject.editor?.focus).toHaveBeenCalled();
    });

    it('should scroll into view on iOS', () => {
      jest.useFakeTimers();
      (KritzelDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

      const scrollIntoViewMock = jest.fn();
      shapeObject.editor!.dom.scrollIntoView = scrollIntoViewMock;

      shapeObject.focus({ x: 100, y: 200 });

      jest.advanceTimersByTime(300);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      jest.useRealTimers();
    });

    it('should not throw if editor is null', () => {
      shapeObject.editor = null;

      expect(() => shapeObject.focus()).not.toThrow();
    });
  });

  describe('edit', () => {
    it('should disable interactive widget', () => {
      shapeObject.edit();

      expect(KritzelKeyboardHelper.disableInteractiveWidget).toHaveBeenCalled();
    });

    it('should clone current object as uneditedObject', () => {
      shapeObject.edit();

      expect(shapeObject.uneditedObject).toBeDefined();
      expect(shapeObject.uneditedObject).not.toBe(shapeObject);
    });

    it('should set active tool to shape', () => {
      shapeObject.edit();

      expect(mockCore.toolRegistry.getTool).toHaveBeenCalledWith('shape');
    });

    it('should set isEditing to true', () => {
      shapeObject.isEditing = false;

      shapeObject.edit();

      expect(shapeObject.isEditing).toBe(true);
    });

    it('should call rerender', () => {
      shapeObject.edit();

      expect(mockRerender).toHaveBeenCalled();
    });

    it('should enable interactive widget after editing starts', () => {
      shapeObject.edit();

      expect(KritzelKeyboardHelper.enableInteractiveWidget).toHaveBeenCalled();
    });

    it('should focus with coordinates when event is provided', () => {
      const focusSpy = jest.spyOn(shapeObject, 'focus');
      const mockEvent = { clientX: 150, clientY: 250 } as PointerEvent;

      shapeObject.edit(mockEvent);

      expect(focusSpy).toHaveBeenCalledWith({ x: 150, y: 250 });
    });

    it('should focus with zero coordinates when event is provided', () => {
      const focusSpy = jest.spyOn(shapeObject, 'focus');
      const mockEvent = { clientX: 0, clientY: 0 } as PointerEvent;

      shapeObject.edit(mockEvent);

      expect(focusSpy).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it('should retry focus on iOS after rerender', () => {
      const focusSpy = jest.spyOn(shapeObject, 'focus');
      (KritzelDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);
      const requestAnimationFrameSpy = jest
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation(callback => {
          callback(16);
          return 1;
        });

      shapeObject.edit({ clientX: 120, clientY: 220 } as PointerEvent);

      expect(requestAnimationFrameSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledTimes(2);

      requestAnimationFrameSpy.mockRestore();
    });
  });

  describe('save', () => {
    beforeEach(() => {
      shapeObject.isEditing = true;
    });

    it('should save content from editor', () => {
      shapeObject.save();

      expect(shapeObject.content).toBeDefined();
    });

    it('should set editor to non-editable', () => {
      shapeObject.save();

      expect(shapeObject.editor?.setProps).toHaveBeenCalled();
    });

    it('should set isEditing to false', () => {
      shapeObject.save();

      expect(shapeObject.isEditing).toBe(false);
    });

    it('should consolidate temporary items', () => {
      shapeObject.save();

      expect(mockObjectsConsolidate).toHaveBeenCalled();
    });

    it('should call objects.update', () => {
      shapeObject.save();

      expect(mockObjectsUpdate).toHaveBeenCalledWith(shapeObject);
    });

    it('should emit objects change', () => {
      shapeObject.save();

      expect(mockEmitObjectsChange).toHaveBeenCalled();
    });
  });

  describe('handlePointerDown', () => {
    it('should stop propagation when editing and pointer is not tracked', () => {
      shapeObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.clear();

      shapeObject.handlePointerDown(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when editing and pointer is tracked', () => {
      shapeObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.set(1, mockEvent);

      shapeObject.handlePointerDown(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not stop propagation when not editing', () => {
      shapeObject.isEditing = false;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;

      shapeObject.handlePointerDown(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerMove', () => {
    it('should stop propagation when editing and pointer is not tracked', () => {
      shapeObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.clear();

      shapeObject.handlePointerMove(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when editing and pointer is tracked', () => {
      shapeObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.set(1, mockEvent);

      shapeObject.handlePointerMove(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not stop propagation when not editing', () => {
      shapeObject.isEditing = false;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;

      shapeObject.handlePointerMove(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerUp', () => {
    it('should stop propagation when editing and pointer is not tracked', () => {
      shapeObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.clear();

      shapeObject.handlePointerUp(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when editing and pointer is tracked', () => {
      shapeObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.set(1, mockEvent);

      shapeObject.handlePointerUp(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not stop propagation when not editing', () => {
      shapeObject.isEditing = false;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;

      shapeObject.handlePointerUp(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('copy', () => {
    it('should create a new shape with same properties', () => {
      shapeObject.shapeType = ShapeType.Ellipse;
      shapeObject.fillColor = { light: '#ff0000', dark: '#ff0000' };
      shapeObject.strokeColor = { light: '#00ff00', dark: '#00ff00' };

      const copiedShape = shapeObject.copy();

      expect(copiedShape).not.toBe(shapeObject);
      expect(copiedShape.shapeType).toBe(ShapeType.Ellipse);
      expect(copiedShape.fillColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(copiedShape.strokeColor).toEqual({ light: '#00ff00', dark: '#00ff00' });
    });

    it('should create a new editor for the copy', () => {
      const copiedShape = shapeObject.copy();

      expect(copiedShape.editor).toBeDefined();
      expect(copiedShape.editor).not.toBe(shapeObject.editor);
    });

    it('should copy content to the new shape', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      shapeObject.content = content;

      const copiedShape = shapeObject.copy();

      expect(copiedShape.editor!.dispatch).toHaveBeenCalled();
    });
  });

  describe('serialize', () => {
    it('should return serializable properties', () => {
      const serialized = shapeObject.serialize();

      expect(serialized.shapeType).toBe(shapeObject.shapeType);
      expect(serialized.fillColor).toEqual(shapeObject.fillColor);
      expect(serialized.strokeColor).toEqual(shapeObject.strokeColor);
      expect(serialized.strokeWidth).toBe(shapeObject.strokeWidth);
      expect(serialized.fontFamily).toBe(shapeObject.fontFamily);
      expect(serialized.fontSize).toBe(shapeObject.fontSize);
      expect(serialized.fontColor).toEqual(shapeObject.fontColor);
    });

    it('should exclude non-serializable properties', () => {
      const serialized = shapeObject.serialize();

      expect(serialized._core).toBeUndefined();
      expect(serialized._elementRef).toBeUndefined();
      expect(serialized._schema).toBeUndefined();
      expect(serialized.editor).toBeUndefined();
      expect(serialized.uneditedObject).toBeUndefined();
    });
  });

  describe('deserialize', () => {
    it('should restore properties from serialized object', () => {
      const serializedData = {
        shapeType: ShapeType.Triangle,
        fillColor: { light: '#00ff00', dark: '#00ff00' },
        strokeColor: { light: '#ff0000', dark: '#ff0000' },
        strokeWidth: 8,
        fontSize: 24,
        fontFamily: 'Georgia',
        fontColor: { light: '#0000ff', dark: '#0000ff' },
        x: 100,
        y: 200,
        width: 150,
        height: 75,
      };

      const newShape = new KritzelShape();
      newShape._core = mockCore;
      newShape.editor = shapeObject.editor;
      newShape.deserialize(serializedData);

      expect(newShape.shapeType).toBe(ShapeType.Triangle);
      expect(newShape.fillColor).toEqual({ light: '#00ff00', dark: '#00ff00' });
      expect(newShape.strokeColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(newShape.strokeWidth).toBe(8);
    });

    it('should restore content if present', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      const serializedData = {
        shapeType: ShapeType.Rectangle,
        content: content,
      };

      const newShape = new KritzelShape();
      newShape._core = mockCore;
      newShape.editor = shapeObject.editor;
      const setContentSpy = jest.spyOn(newShape, 'setContent');

      newShape.deserialize(serializedData);

      expect(setContentSpy).toHaveBeenCalledWith(content);
    });
  });

  describe('getClipPolygon', () => {
    beforeEach(() => {
      shapeObject.translateX = 0;
      shapeObject.translateY = 0;
      shapeObject.width = 100;
      shapeObject.height = 50;
      shapeObject.scale = 1;
      shapeObject.padding = 0;
      shapeObject.strokeWidth = 4;
      shapeObject.rotation = 0;
    });

    it('should return null for rectangle shape', () => {
      shapeObject.shapeType = ShapeType.Rectangle;

      const polygon = shapeObject.getClipPolygon();

      expect(polygon).toBeNull();
    });

    it('should return ellipse polygon approximation for ellipse shape', () => {
      shapeObject.shapeType = ShapeType.Ellipse;

      const polygon = shapeObject.getClipPolygon();

      expect(KritzelGeometryHelper.getEllipsePolygonApproximation).toHaveBeenCalled();
      expect(polygon).toBeDefined();
      expect(Array.isArray(polygon)).toBe(true);
    });

    it('should return 3 points for triangle shape', () => {
      shapeObject.shapeType = ShapeType.Triangle;

      const polygon = shapeObject.getClipPolygon();

      expect(polygon).toBeDefined();
      expect(polygon?.length).toBe(3);
    });

    it('should apply rotation for triangle shape', () => {
      shapeObject.shapeType = ShapeType.Triangle;
      shapeObject.rotation = Math.PI / 4; // 45 degrees

      const polygon = shapeObject.getClipPolygon();

      expect(polygon).toBeDefined();
      expect(polygon?.length).toBe(3);
      // With rotation, the points should be rotated around center
    });
  });

  describe('getSvgPath', () => {
    beforeEach(() => {
      shapeObject.x = 0;
      shapeObject.y = 0;
      shapeObject.width = 100;
      shapeObject.height = 50;
    });

    it('should return rectangle path for rectangle shape', () => {
      shapeObject.shapeType = ShapeType.Rectangle;

      const path = shapeObject.getSvgPath();

      expect(path).toBe('M 0 0 L 100 0 L 100 50 L 0 50 Z');
    });

    it('should return ellipse path for ellipse shape', () => {
      shapeObject.shapeType = ShapeType.Ellipse;

      const path = shapeObject.getSvgPath();

      expect(path).toContain('A'); // Contains arc commands
      expect(path).toMatch(/M .* A .* A .*/); // Two arc segments
    });

    it('should return triangle path for triangle shape', () => {
      shapeObject.shapeType = ShapeType.Triangle;

      const path = shapeObject.getSvgPath();

      expect(path).toBe('M 50 0 L 100 50 L 0 50 Z');
    });

    it('should return default rectangle path for unknown shape type', () => {
      (shapeObject as any).shapeType = 'unknown';

      const path = shapeObject.getSvgPath();

      expect(path).toBe('M 0 0 L 100 0 L 100 50 L 0 50 Z');
    });

    it('should handle offset x and y values', () => {
      shapeObject.shapeType = ShapeType.Rectangle;
      shapeObject.x = 20;
      shapeObject.y = 30;

      const path = shapeObject.getSvgPath();

      expect(path).toBe('M 20 30 L 120 30 L 120 80 L 20 80 Z');
    });
  });
});
