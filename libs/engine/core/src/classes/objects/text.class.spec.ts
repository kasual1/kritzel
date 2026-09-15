import { KritzelText } from './text.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { KritzelDevicesHelper } from '../../helpers/devices.helper';

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

describe('KritzelText', () => {
  let textObject: KritzelText;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;
  let mockObjectsConsolidate: jest.Mock;
  let mockSetState: jest.Mock;
  let mockRerender: jest.Mock;
  let mockEmitObjectsChange: jest.Mock;
  let mockEmitObjectsAdded: jest.Mock;
  let mockEmitObjectsUpdated: jest.Mock;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    const objectsUpdate = jest.fn();
    const objectsConsolidate = jest.fn();
    const setState = jest.fn();
    const rerender = jest.fn();
    const emitObjectsChange = jest.fn();
    const emitObjectsAdded = jest.fn();
    const emitObjectsUpdated = jest.fn();

    mockObjectsUpdate = objectsUpdate;
    mockObjectsConsolidate = objectsConsolidate;
    mockSetState = setState;
    mockRerender = rerender;
    mockEmitObjectsChange = emitObjectsChange;
    mockEmitObjectsAdded = emitObjectsAdded;
    mockEmitObjectsUpdated = emitObjectsUpdated;

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
        setState: setState,
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
        emitObjectsAdded: emitObjectsAdded,
        emitObjectsUpdated: emitObjectsUpdated,
      },
      toolRegistry: {
        getTool: jest.fn(() => ({ name: 'text' })),
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  beforeEach(() => {
    mockCore = createMockCore();

    // Use static create method to properly initialize the text object
    textObject = KritzelText.create(mockCore, 12, 'Helvetica');
    textObject.translateX = 10;
    textObject.translateY = 20;
    textObject.fontColor = { light: '#ff0000', dark: '#ff0000' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a text object with default values when no config provided', () => {
      const defaultText = new KritzelText();

      expect(defaultText.fontFamily).toBe('Arial');
      expect(defaultText.fontSize).toBe(8);
      expect(defaultText.fontColor).toEqual({ light: '#000000', dark: '#ffffff' });
      expect(defaultText.__class__).toBe('KritzelText');
      expect(defaultText.isEditable).toBe(true);
      expect(defaultText.isEditing).toBe(false);
      expect(defaultText.rows).toBe(1);
    });

    it('should set default property values', () => {
      expect(textObject.isDebugInfoVisible).toBe(true);
      expect(textObject.isEditable).toBe(true);
      expect(textObject.isEditing).toBe(false);
      expect(textObject.content).toBeNull();
      expect(textObject.uneditedObject).toBeNull();
    });

    it('should convert constructor rotation from degrees to radians', () => {
      const configuredText = new KritzelText({
        text: 'Hello',
        rotation: -90,
      });

      expect(configuredText.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('static create', () => {
    it('should create a text object with core reference and workspace id', () => {
      const createdText = KritzelText.create(mockCore, 14, 'Georgia');

      expect(createdText._core).toBe(mockCore);
      expect(createdText.workspaceId).toBe('workspace-1');
      expect(createdText.zIndex).toBe(1);
      expect(createdText.fontSize).toBe(14);
      expect(createdText.fontFamily).toBe('Georgia');
    });

    it('should generate a unique id', () => {
      const text1 = KritzelText.create(mockCore);
      const text2 = KritzelText.create(mockCore);

      expect(text1.id).toBeDefined();
      expect(text2.id).toBeDefined();
      expect(text1.id).not.toBe(text2.id);
    });

    it('should set transparent background', () => {
      const createdText = KritzelText.create(mockCore);

      expect(createdText.backgroundColor).toEqual({ light: 'transparent', dark: 'transparent' });
    });

    it('should create an editor', () => {
      const createdText = KritzelText.create(mockCore);

      expect(createdText.editor).toBeDefined();
    });

    it('should convert create rotation from degrees to radians', () => {
      const createdText = KritzelText.create(mockCore, 12, 'Helvetica', undefined, -90);

      expect(createdText.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('isEmpty getter', () => {
    it('should return true when editor is null', () => {
      textObject.editor = null;

      expect(textObject.isEmpty).toBe(true);
    });

    it('should return true when document content size is 0', () => {
      Object.defineProperty(textObject.editor!.state.doc.content, 'size', { value: 0, writable: true });

      expect(textObject.isEmpty).toBe(true);
    });

    it('should return true when text content is empty', () => {
      Object.defineProperty(textObject.editor!.state.doc, 'textContent', { value: '   ', writable: true });

      expect(textObject.isEmpty).toBe(true);
    });

    it('should return false when there is text content', () => {
      Object.defineProperty(textObject.editor!.state.doc.content, 'size', { value: 10, writable: true });
      Object.defineProperty(textObject.editor!.state.doc, 'textContent', { value: 'Hello World', writable: true });

      expect(textObject.isEmpty).toBe(false);
    });
  });

  describe('mount', () => {
    it('should set elementRef and isMounted to true', () => {
      textObject.isMounted = false;
      const mockElement = document.createElement('div');

      // Mock isInViewport to return true
      jest.spyOn(textObject, 'isInViewport').mockReturnValue(true);

      textObject.mount(mockElement);

      expect(textObject.elementRef).toBe(mockElement);
      expect(textObject.isMounted).toBe(true);
    });

    it('should not mount if element is null', () => {
      textObject.isMounted = false;
      textObject.mount(null as unknown as HTMLDivElement);

      expect(textObject.isMounted).toBe(false);
    });

    it('should not mount if not in viewport', () => {
      textObject.isMounted = false;
      const mockElement = document.createElement('div');

      jest.spyOn(textObject, 'isInViewport').mockReturnValue(false);

      textObject.mount(mockElement);

      expect(textObject.isMounted).toBe(false);
    });

    it('should apply font styles to element', () => {
      const mockElement = document.createElement('div');
      jest.spyOn(textObject, 'isInViewport').mockReturnValue(true);

      textObject.mount(mockElement);

      expect(mockElement.style.fontFamily).toBe('Helvetica');
      expect(mockElement.style.fontSize).toBe('12pt');
      expect(mockElement.style.color).toBe('#ff0000');
      expect(mockElement.style.whiteSpace).toBe('pre-wrap');
      expect(mockElement.style.wordWrap).toBe('break-word');
    });

    it('should resolve font color using the current core theme', () => {
      const mockElement = document.createElement('div');
      textObject.fontColor = { light: '#111111', dark: '#eeeeee' };
      Object.defineProperty(mockCore.themeManager, 'currentTheme', { value: 'dark', configurable: true });
      jest.spyOn(textObject, 'isInViewport').mockReturnValue(true);

      textObject.mount(mockElement);

      expect(mockElement.style.color).toBe('#eeeeee');
    });

    it('should append editor dom to element', () => {
      const mockElement = document.createElement('div');
      jest.spyOn(textObject, 'isInViewport').mockReturnValue(true);

      textObject.mount(mockElement);

      expect(mockElement.children.length).toBe(1);
      expect(mockElement.children[0]).toBe(textObject.editor!.dom);
    });

    it('should not remount if already mounted with same element', () => {
      const mockElement = document.createElement('div');
      jest.spyOn(textObject, 'isInViewport').mockReturnValue(true);

      textObject.mount(mockElement);
      const appendChildSpy = jest.spyOn(mockElement, 'appendChild');

      textObject.mount(mockElement);

      expect(appendChildSpy).not.toHaveBeenCalled();
    });
  });

  describe('setContent', () => {
    it('should set content property', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      textObject.setContent(content);

      expect(textObject.content).toEqual(content);
    });

    it('should dispatch transaction to editor when content is provided', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      textObject.setContent(content);

      expect(textObject.editor!.dispatch).toHaveBeenCalled();
    });

    it('should not dispatch if content is null', () => {
      textObject.setContent(null);

      expect(textObject.editor!.dispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch if editor is null', () => {
      textObject.editor = null;
      const content = { type: 'doc', content: [] };

      expect(() => textObject.setContent(content)).not.toThrow();
    });
  });

  describe('adjustSizeOnInput', () => {
    it('should not adjust if element is not mounted', () => {
      textObject.isMounted = false;
      const originalWidth = textObject.width;

      textObject.adjustSizeOnInput();

      expect(textObject.width).toBe(originalWidth);
    });

    it('should update width and height based on element scroll dimensions', () => {
      const mockElement = document.createElement('div');
      Object.defineProperty(mockElement, 'scrollWidth', { value: 200, configurable: true });
      Object.defineProperty(mockElement, 'scrollHeight', { value: 100, configurable: true });

      textObject.elementRef = mockElement;
      textObject.isMounted = true;
      textObject.scaleFactor = 1;

      textObject.adjustSizeOnInput();

      expect(textObject.width).toBe(200);
      expect(textObject.height).toBe(100);
    });

    it('should apply scale factor to dimensions', () => {
      const mockElement = document.createElement('div');
      Object.defineProperty(mockElement, 'scrollWidth', { value: 200, configurable: true });
      Object.defineProperty(mockElement, 'scrollHeight', { value: 100, configurable: true });

      textObject.elementRef = mockElement;
      textObject.isMounted = true;
      textObject.scaleFactor = 2;

      textObject.adjustSizeOnInput();

      expect(textObject.width).toBe(400);
      expect(textObject.height).toBe(200);
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      textObject.width = 100;
      textObject.height = 50;
      textObject.scaleFactor = 1;
    });

    it('should update position', () => {
      textObject.resize(50, 75, 200, 100);

      expect(textObject.translateX).toBe(50);
      expect(textObject.translateY).toBe(75);
    });

    it('should calculate uniform scale factor', () => {
      textObject.resize(0, 0, 200, 100);

      // Original: 100x50, new: 200x100
      // scaleX = 200/100 = 2, scaleY = 100/50 = 2
      // scaleFactor = min(2, 2) = 2
      expect(textObject.scaleFactor).toBe(2);
    });

    it('should not resize if width is less than or equal to 1', () => {
      const originalWidth = textObject.width;
      const originalScaleFactor = textObject.scaleFactor;

      textObject.resize(0, 0, 0.5, 100);

      expect(textObject.width).toBe(originalWidth);
      expect(textObject.scaleFactor).toBe(originalScaleFactor);
    });

    it('should not resize if height is less than or equal to 1', () => {
      const originalHeight = textObject.height;
      const originalScaleFactor = textObject.scaleFactor;

      textObject.resize(0, 0, 200, 0.5);

      expect(textObject.height).toBe(originalHeight);
      expect(textObject.scaleFactor).toBe(originalScaleFactor);
    });

    it('should call objects.update after resizing', () => {
      textObject.resize(0, 0, 200, 100);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(textObject);
    });
  });

  describe('focus', () => {
    it('should dispatch selection and focus editor', () => {
      textObject.focus({ x: 0, y: 0 });

      expect(textObject.editor!.dispatch).toHaveBeenCalled();
      expect(textObject.editor!.focus).toHaveBeenCalled();
    });

    it('should use coordinates when provided', () => {
      textObject.focus({ x: 100, y: 200 });

      expect(textObject.editor!.posAtCoords).toHaveBeenCalledWith({ left: 100, top: 200 });
      expect(textObject.editor!.focus).toHaveBeenCalled();
    });

    it('should scroll into view on iOS', () => {
      jest.useFakeTimers();
      (KritzelDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

      const scrollIntoViewMock = jest.fn();
      textObject.editor!.dom.scrollIntoView = scrollIntoViewMock;

      textObject.focus({ x: 100, y: 200 });

      jest.advanceTimersByTime(300);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      jest.useRealTimers();
    });
  });

  describe('edit', () => {
    it('should disable interactive widget', () => {
      textObject.edit();

      expect(KritzelKeyboardHelper.disableInteractiveWidget).toHaveBeenCalled();
    });

    it('should clone current object as uneditedObject', () => {
      textObject.edit();

      expect(textObject.uneditedObject).toBeDefined();
      expect(textObject.uneditedObject).not.toBe(textObject);
    });

    it('should set active tool to text', () => {
      textObject.edit();

      expect(mockSetState).toHaveBeenCalledWith('activeTool', expect.anything());
      expect(mockCore.toolRegistry.getTool).toHaveBeenCalledWith('text');
    });

    it('should set editor to editable', () => {
      textObject.edit();

      expect(textObject.editor!.setProps).toHaveBeenCalled();
    });

    it('should set isEditing to true', () => {
      textObject.edit();

      expect(textObject.isEditing).toBe(true);
    });

    it('should call rerender', () => {
      textObject.edit();

      expect(mockRerender).toHaveBeenCalled();
    });

    it('should enable interactive widget', () => {
      textObject.edit();

      expect(KritzelKeyboardHelper.enableInteractiveWidget).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    beforeEach(() => {
      textObject.isEditing = true;
    });

    it('should save content from editor state', () => {
      jest.useFakeTimers();

      textObject.save();

      jest.runAllTimers();

      expect(textObject.content).toBeDefined();

      jest.useRealTimers();
    });

    it('should set editor to non-editable', () => {
      textObject.save();

      expect(textObject.editor!.setProps).toHaveBeenCalled();
    });

    it('should set isEditing to false', () => {
      textObject.save();

      expect(textObject.isEditing).toBe(false);
    });

    it('should consolidate temporary items', () => {
      textObject.save();

      expect(mockObjectsConsolidate).toHaveBeenCalled();
    });

    it('should call objects.update', () => {
      textObject.save();

      expect(mockObjectsUpdate).toHaveBeenCalledWith(textObject);
    });

    it('should emit objects change', () => {
      textObject.save();

      expect(mockEmitObjectsChange).toHaveBeenCalled();
      expect(mockEmitObjectsUpdated).toHaveBeenCalled();
      expect(mockEmitObjectsAdded).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerDown', () => {
    it('should stop propagation when editing', () => {
      textObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn() } as unknown as PointerEvent;

      textObject.handlePointerDown(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when not editing', () => {
      textObject.isEditing = false;
      const mockEvent = { stopPropagation: jest.fn() } as unknown as PointerEvent;

      textObject.handlePointerDown(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerMove', () => {
    it('should stop propagation when editing and pointer is not tracked', () => {
      textObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.clear();

      textObject.handlePointerMove(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when editing and pointer is tracked', () => {
      textObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.set(1, mockEvent);

      textObject.handlePointerMove(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not stop propagation when not editing', () => {
      textObject.isEditing = false;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;

      textObject.handlePointerMove(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerUp', () => {
    it('should stop propagation when editing and pointer is not tracked', () => {
      textObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.clear();

      textObject.handlePointerUp(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation when editing and pointer is tracked', () => {
      textObject.isEditing = true;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;
      mockCore.store.state.pointers.set(1, mockEvent);

      textObject.handlePointerUp(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not stop propagation when not editing', () => {
      textObject.isEditing = false;
      const mockEvent = { stopPropagation: jest.fn(), pointerId: 1 } as unknown as PointerEvent;

      textObject.handlePointerUp(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('copy', () => {
    it('should create a copy with a new id', () => {
      const copied = textObject.copy();

      expect(copied.id).not.toBe(textObject.id);
    });

    it('should create a new editor for the copy', () => {
      const originalEditor = textObject.editor;
      const copied = textObject.copy();

      expect(copied.editor).toBeDefined();
      expect(copied.editor).not.toBe(originalEditor);
    });

    it('should copy content to new text object', () => {
      textObject.content = { type: 'doc', content: [{ type: 'paragraph' }] };

      const copied = textObject.copy();

      // setContent should have been called on the copied editor
      expect(copied.editor!.dispatch).toHaveBeenCalled();
    });

    it('should preserve font properties', () => {
      const copied = textObject.copy();

      expect(copied.fontSize).toBe(textObject.fontSize);
      expect(copied.fontFamily).toBe(textObject.fontFamily);
      expect(copied.fontColor).toBe(textObject.fontColor);
    });
  });

  describe('serialize', () => {
    it('should exclude _core from serialization', () => {
      const serialized = textObject.serialize();

      expect(serialized._core).toBeUndefined();
    });

    it('should exclude _elementRef from serialization', () => {
      const serialized = textObject.serialize();

      expect(serialized._elementRef).toBeUndefined();
    });

    it('should exclude _schema from serialization', () => {
      const serialized = textObject.serialize();

      expect(serialized._schema).toBeUndefined();
    });

    it('should exclude editor from serialization', () => {
      const serialized = textObject.serialize();

      expect(serialized.editor).toBeUndefined();
    });

    it('should exclude uneditedObject from serialization', () => {
      textObject.uneditedObject = textObject.clone() as KritzelText;
      const serialized = textObject.serialize();

      expect(serialized.uneditedObject).toBeUndefined();
    });

    it('should exclude totalWidth and totalHeight getters', () => {
      const serialized = textObject.serialize();

      expect(serialized.totalWidth).toBeUndefined();
      expect(serialized.totalHeight).toBeUndefined();
    });

    it('should include text-specific properties', () => {
      textObject.content = { type: 'doc', content: [] };
      const serialized = textObject.serialize();

      expect(serialized.fontSize).toBe(12);
      expect(serialized.fontFamily).toBe('Helvetica');
      expect(serialized.fontColor).toEqual({ light: '#ff0000', dark: '#ff0000' });
      expect(serialized.content).toEqual({ type: 'doc', content: [] });
    });
  });

  describe('deserialize', () => {
    it('should assign all properties from object', () => {
      const data = {
        id: 'test-id',
        translateX: 100,
        translateY: 200,
        fontSize: 18,
        fontFamily: 'Courier',
        fontColor: '#0000ff',
        width: 300,
        height: 100,
      };

      textObject.deserialize(data);

      expect(textObject.id).toBe('test-id');
      expect(textObject.translateX).toBe(100);
      expect(textObject.translateY).toBe(200);
      expect(textObject.fontSize).toBe(18);
      expect(textObject.fontFamily).toBe('Courier');
      expect(textObject.fontColor).toBe('#0000ff');
    });

    it('should set content when provided', () => {
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      const data = { content };

      const setContentSpy = jest.spyOn(textObject, 'setContent');
      textObject.deserialize(data);

      expect(setContentSpy).toHaveBeenCalledWith(content);
    });

    it('should return the object itself', () => {
      const result = textObject.deserialize({ width: 100 });

      expect(result).toBe(textObject);
    });
  });

  describe('clone', () => {
    it('should create a copy with the same id', () => {
      textObject.width = 200;
      textObject.height = 100;

      const cloned = textObject.clone();

      expect(cloned.id).toBe(textObject.id);
      expect(cloned.width).toBe(200);
      expect(cloned.height).toBe(100);
    });

    it('should create an independent object', () => {
      const cloned = textObject.clone();
      cloned.width = 500;

      expect(textObject.width).not.toBe(500);
    });
  });
});
