import { KritzelSelectionTool } from './selection-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelMoveHandler } from '../handlers/move.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';
import { KritzelHoverHandler } from '../handlers/hover.handler';
import { KritzelLineHandleHandler } from '../handlers/line-handle.handler';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelColorHelper } from '../../helpers/color.helper';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelDynamicObject } from '../objects/dynamic-object.class';
import { DEFAULT_COLOR_PALETTE } from '../../constants/color-palette.constants';

jest.mock('../core/core.class');
jest.mock('../handlers/move.handler');
jest.mock('../handlers/resize.handler');
jest.mock('../handlers/rotation.handler');
jest.mock('../handlers/selection.handler');
jest.mock('../handlers/hover.handler');
jest.mock('../handlers/line-handle.handler');
jest.mock('../../helpers/event.helper');
jest.mock('../../helpers/color.helper');
jest.mock('../objects/selection-group.class');

describe('KritzelSelectionTool', () => {
  let tool: KritzelSelectionTool;
  let mockCore: any;
  let mockState: any;

  const createMockPath = (props: any = {}) => {
    const obj = Object.create(KritzelPath.prototype);
    return Object.assign(obj, {
      fill: DEFAULT_COLOR_PALETTE[0],
      strokeWidth: 6,
      opacity: 1,
      ...props,
    });
  };

  const createMockLine = (props: any = {}) => {
    const obj = Object.create(KritzelLine.prototype);
    return Object.assign(obj, {
      __class__: 'KritzelLine',
      stroke: DEFAULT_COLOR_PALETTE[1],
      strokeWidth: 4,
      opacity: 1,
      arrows: undefined,
      ...props,
    });
  };

  const createMockText = (props: any = {}) => {
    const obj = Object.create(KritzelText.prototype);
    return Object.assign(obj, {
      fontColor: DEFAULT_COLOR_PALETTE[2],
      fontSize: 16,
      fontFamily: 'Arial',
      opacity: 1,
      ...props,
    });
  };

  const createMockShape = (props: any = {}) => {
    const obj = Object.create(KritzelShape.prototype);
    return Object.assign(obj, {
      strokeColor: DEFAULT_COLOR_PALETTE[0],
      strokeWidth: 2,
      fillColor: { light: 'transparent', dark: 'transparent' },
      fontFamily: 'Helvetica',
      opacity: 1,
      ...props,
    });
  };

  const createMockImage = (props: any = {}) => {
    const obj = Object.create(KritzelImage.prototype);
    return Object.assign(obj, {
      opacity: 1,
      ...props,
    });
  };

  const createMockGroup = (children: any[]) => {
    const obj = Object.create(KritzelGroup.prototype);
    obj.__class__ = 'KritzelGroup';
    Object.defineProperty(obj, 'children', { value: children, configurable: true });
    return obj;
  };

  const createMouseEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
      composedPath: jest.fn().mockReturnValue([
        { classList: { contains: jest.fn().mockReturnValue(false) } },
      ]),
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createTouchEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'touch',
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
      composedPath: jest.fn().mockReturnValue([
        { classList: { contains: jest.fn().mockReturnValue(false) } },
      ]),
      ...overrides,
    } as unknown as PointerEvent;
  };

  const createPenEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      pointerType: 'pen',
      clientX: 100,
      clientY: 200,
      cancelable: true,
      preventDefault: jest.fn(),
      composedPath: jest.fn().mockReturnValue([
        { classList: { contains: jest.fn().mockReturnValue(false) } },
      ]),
      ...overrides,
    } as unknown as PointerEvent;
  };

  const setSelectionGroupObjects = (objects: any[]) => {
    mockCore.store.selectionGroup = {
      id: 'sg-1',
      objects,
      refreshObjectDimensions: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockState = {
      isDrawing: false,
      isScaling: false,
      isResizeHandleSelected: false,
      isRotationHandleSelected: false,
      isLineHandleSelected: false,
      resizeHandleType: undefined,
      lineHandleType: undefined,
      skipContextMenu: false,
      pointers: new Map(),
      host: {
        shadowRoot: {
          elementsFromPoint: jest.fn().mockReturnValue([]),
        },
      },
    };

    mockCore = {
      objectTitlebarManager: {
        config: undefined,
        getOwnerFromEvent: jest.fn().mockReturnValue(null),
        getEditableTitleFromEvent: jest.fn().mockReturnValue(null),
        startTitleEditing: jest.fn(),
        isControlEvent: jest.fn().mockReturnValue(false),
        resetWarnings: jest.fn(),
      },
      store: {
        get state() { return mockState; },
        selectionGroup: null as any,
        setState: jest.fn(),
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      rerender: jest.fn(),
      updateObject: jest.fn(),
      findObjectById: jest.fn().mockReturnValue(undefined),
      removeSelectionGroup: jest.fn(),
      addSelectionGroup: jest.fn(),
      getCanvasPoint: jest.fn().mockReturnValue({ x: 100, y: 200 }),
    } as unknown as jest.Mocked<KritzelCore>;

    (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(true);
    (KritzelColorHelper.determineTextColor as jest.Mock).mockReturnValue({ light: '#ffffff', dark: '#000000' });

    tool = new KritzelSelectionTool(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Constructor
  // ============================================

  describe('constructor', () => {
    it('should initialize all handlers', () => {
      expect(KritzelSelectionHandler).toHaveBeenCalledWith(mockCore);
      expect(KritzelMoveHandler).toHaveBeenCalledWith(mockCore);
      expect(KritzelHoverHandler).toHaveBeenCalledWith(mockCore);
      expect(KritzelResizeHandler).toHaveBeenCalledWith(mockCore);
      expect(KritzelRotationHandler).toHaveBeenCalledWith(mockCore);
      expect(KritzelLineHandleHandler).toHaveBeenCalledWith(mockCore);
    });

    it('should have default palette matching DEFAULT_COLOR_PALETTE', () => {
      expect(tool.palette).toEqual(DEFAULT_COLOR_PALETTE);
    });

    it('should expose handler instances as public properties', () => {
      expect(tool.selectionHandler).toBeDefined();
      expect(tool.moveHandler).toBeDefined();
      expect(tool.hoverHandler).toBeDefined();
      expect(tool.resizeHandler).toBeDefined();
      expect(tool.rotationHandler).toBeDefined();
      expect(tool.lineHandleHandler).toBeDefined();
    });
  });

  // ============================================
  // hasSelection
  // ============================================

  describe('hasSelection', () => {
    it('should return false when no selection group exists', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.hasSelection()).toBe(false);
    });

    it('should return false when selection group has no objects', () => {
      setSelectionGroupObjects([]);

      expect(tool.hasSelection()).toBe(false);
    });

    it('should return true when selection group has objects', () => {
      setSelectionGroupObjects([createMockPath()]);

      expect(tool.hasSelection()).toBe(true);
    });
  });

  // ============================================
  // getSelectedObjects
  // ============================================

  describe('getSelectedObjects', () => {
    it('should return objects from selection group', () => {
      const objects = [createMockPath(), createMockLine()];
      setSelectionGroupObjects(objects);

      expect(tool.getSelectedObjects()).toBe(objects);
    });

    it('should return empty array when no selection group', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.getSelectedObjects()).toEqual([]);
    });

    it('should return empty array when selectionGroup is undefined', () => {
      mockCore.store.selectionGroup = undefined;

      expect(tool.getSelectedObjects()).toEqual([]);
    });
  });

  // ============================================
  // color getter
  // ============================================

  describe('color getter', () => {
    it('should return default color when no selection', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.color).toEqual(DEFAULT_COLOR_PALETTE[0]);
    });

    it('should return default color when selection is empty', () => {
      setSelectionGroupObjects([]);

      expect(tool.color).toEqual(DEFAULT_COLOR_PALETTE[0]);
    });

    it('should return fill from KritzelPath', () => {
      const fill = { light: '#ff0000', dark: '#ff0000' };
      setSelectionGroupObjects([createMockPath({ fill })]);

      expect(tool.color).toEqual(fill);
    });

    it('should return stroke from KritzelLine', () => {
      const stroke = { light: '#00ff00', dark: '#00ff00' };
      setSelectionGroupObjects([createMockLine({ stroke })]);

      expect(tool.color).toEqual(stroke);
    });

    it('should return fontColor from KritzelText', () => {
      const fontColor = { light: '#0000ff', dark: '#0000ff' };
      setSelectionGroupObjects([createMockText({ fontColor })]);

      expect(tool.color).toEqual(fontColor);
    });

    it('should return strokeColor from KritzelShape', () => {
      const strokeColor = { light: '#ff00ff', dark: '#ff00ff' };
      setSelectionGroupObjects([createMockShape({ strokeColor })]);

      expect(tool.color).toEqual(strokeColor);
    });

    it('should return default color for Image objects', () => {
      setSelectionGroupObjects([createMockImage()]);

      expect(tool.color).toEqual(DEFAULT_COLOR_PALETTE[0]);
    });

    it('should return color from first matching object', () => {
      const lineFill = { light: '#111111', dark: '#111111' };
      setSelectionGroupObjects([createMockImage(), createMockLine({ stroke: lineFill })]);

      expect(tool.color).toEqual(lineFill);
    });

    it('should flatten groups and return color from children', () => {
      const childPath = createMockPath({ fill: { light: '#aabbcc', dark: '#aabbcc' } });
      const group = createMockGroup([childPath]);
      setSelectionGroupObjects([group]);

      expect(tool.color).toEqual({ light: '#aabbcc', dark: '#aabbcc' });
    });
  });

  // ============================================
  // color setter
  // ============================================

  describe('color setter', () => {
    it('should update fill on KritzelPath', () => {
      const path = createMockPath();
      setSelectionGroupObjects([path]);
      const newColor = { light: '#ff0000', dark: '#ff0000' };

      tool.color = newColor;

      expect(mockCore.updateObject).toHaveBeenCalledWith(path, { fill: newColor });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update stroke on KritzelLine', () => {
      const line = createMockLine();
      setSelectionGroupObjects([line]);
      const newColor = { light: '#00ff00', dark: '#00ff00' };

      tool.color = newColor;

      expect(mockCore.updateObject).toHaveBeenCalledWith(line, { stroke: newColor });
    });

    it('should update fontColor on KritzelText', () => {
      const text = createMockText();
      setSelectionGroupObjects([text]);
      const newColor = { light: '#0000ff', dark: '#0000ff' };

      tool.color = newColor;

      expect(mockCore.updateObject).toHaveBeenCalledWith(text, { fontColor: newColor });
    });

    it('should update strokeColor on KritzelShape', () => {
      const shape = createMockShape();
      setSelectionGroupObjects([shape]);
      const newColor = { light: '#ff00ff', dark: '#ff00ff' };

      tool.color = newColor;

      expect(mockCore.updateObject).toHaveBeenCalledWith(shape, { strokeColor: newColor });
    });

    it('should update all objects in selection', () => {
      const path = createMockPath();
      const line = createMockLine();
      setSelectionGroupObjects([path, line]);
      const newColor = { light: '#123456', dark: '#123456' };

      tool.color = newColor;

      expect(mockCore.updateObject).toHaveBeenCalledWith(path, { fill: newColor });
      expect(mockCore.updateObject).toHaveBeenCalledWith(line, { stroke: newColor });
    });

    it('should flatten groups before updating', () => {
      const childPath = createMockPath();
      const group = createMockGroup([childPath]);
      setSelectionGroupObjects([group]);
      const newColor = { light: '#abcdef', dark: '#abcdef' };

      tool.color = newColor;

      expect(mockCore.updateObject).toHaveBeenCalledWith(childPath, { fill: newColor });
    });
  });

  // ============================================
  // opacity getter / setter
  // ============================================

  describe('opacity getter', () => {
    it('should return 1 when no selection', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.opacity).toBe(1);
    });

    it('should return opacity from first object', () => {
      setSelectionGroupObjects([createMockPath({ opacity: 0.5 })]);

      expect(tool.opacity).toBe(0.5);
    });
  });

  describe('opacity setter', () => {
    it('should update opacity on all objects', () => {
      const path = createMockPath();
      const line = createMockLine();
      setSelectionGroupObjects([path, line]);

      tool.opacity = 0.7;

      expect(mockCore.updateObject).toHaveBeenCalledWith(path, { opacity: 0.7 });
      expect(mockCore.updateObject).toHaveBeenCalledWith(line, { opacity: 0.7 });
      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  // ============================================
  // size getter / setter
  // ============================================

  describe('size getter', () => {
    it('should return 1 when no selection', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.size).toBe(1);
    });

    it('should return strokeWidth from KritzelPath', () => {
      setSelectionGroupObjects([createMockPath({ strokeWidth: 8 })]);

      expect(tool.size).toBe(8);
    });

    it('should return strokeWidth from KritzelLine', () => {
      setSelectionGroupObjects([createMockLine({ strokeWidth: 3 })]);

      expect(tool.size).toBe(3);
    });

    it('should return fontSize from KritzelText', () => {
      setSelectionGroupObjects([createMockText({ fontSize: 24 })]);

      expect(tool.size).toBe(24);
    });

    it('should return strokeWidth from KritzelShape', () => {
      setSelectionGroupObjects([createMockShape({ strokeWidth: 5 })]);

      expect(tool.size).toBe(5);
    });

    it('should return 1 for Image objects', () => {
      setSelectionGroupObjects([createMockImage()]);

      expect(tool.size).toBe(1);
    });
  });

  describe('size setter', () => {
    it('should update strokeWidth on KritzelPath', () => {
      const path = createMockPath();
      setSelectionGroupObjects([path]);

      tool.size = 10;

      expect(mockCore.updateObject).toHaveBeenCalledWith(path, { strokeWidth: 10 });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update strokeWidth on KritzelLine', () => {
      const line = createMockLine();
      setSelectionGroupObjects([line]);

      tool.size = 5;

      expect(mockCore.updateObject).toHaveBeenCalledWith(line, { strokeWidth: 5 });
    });

    it('should update fontSize on KritzelText', () => {
      const text = createMockText();
      setSelectionGroupObjects([text]);

      tool.size = 20;

      expect(mockCore.updateObject).toHaveBeenCalledWith(text, { fontSize: 20 });
    });

    it('should update strokeWidth on KritzelShape', () => {
      const shape = createMockShape();
      setSelectionGroupObjects([shape]);

      tool.size = 3;

      expect(mockCore.updateObject).toHaveBeenCalledWith(shape, { strokeWidth: 3 });
    });
  });

  // ============================================
  // fillColor getter / setter
  // ============================================

  describe('fillColor getter', () => {
    it('should return transparent when no shapes in selection', () => {
      setSelectionGroupObjects([createMockPath()]);

      expect(tool.fillColor).toEqual({ light: 'transparent', dark: 'transparent' });
    });

    it('should return transparent when no selection', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.fillColor).toEqual({ light: 'transparent', dark: 'transparent' });
    });

    it('should return fillColor from KritzelShape', () => {
      const fillColor = { light: '#ff0000', dark: '#ff0000' };
      setSelectionGroupObjects([createMockShape({ fillColor })]);

      expect(tool.fillColor).toEqual(fillColor);
    });
  });

  describe('fillColor setter', () => {
    it('should update fillColor and fontColor on KritzelShape', () => {
      const shape = createMockShape();
      setSelectionGroupObjects([shape]);
      const newFill = { light: '#00ff00', dark: '#00ff00' };
      const expectedTextColor = { light: '#ffffff', dark: '#000000' };

      tool.fillColor = newFill;

      expect(KritzelColorHelper.determineTextColor).toHaveBeenCalledWith(newFill);
      expect(mockCore.updateObject).toHaveBeenCalledWith(shape, { fillColor: newFill, fontColor: expectedTextColor });
    });

    it('should update strokeColor when fill is not transparent', () => {
      const shape = createMockShape();
      setSelectionGroupObjects([shape]);
      const newFill = { light: '#ff0000', dark: '#ff0000' };

      tool.fillColor = newFill;

      expect(mockCore.updateObject).toHaveBeenCalledWith(shape, { strokeColor: newFill });
    });

    it('should not update strokeColor when fill is transparent', () => {
      const shape = createMockShape();
      setSelectionGroupObjects([shape]);
      const transparentFill = { light: 'transparent', dark: 'transparent' };

      tool.fillColor = transparentFill;

      expect(mockCore.updateObject).not.toHaveBeenCalledWith(shape, { strokeColor: transparentFill });
    });

    it('should not affect non-shape objects', () => {
      const path = createMockPath();
      setSelectionGroupObjects([path]);
      const newFill = { light: '#ff0000', dark: '#ff0000' };

      tool.fillColor = newFill;

      expect(mockCore.updateObject).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // fontFamily getter / setter
  // ============================================

  describe('fontFamily getter', () => {
    it('should return Arial when no selection', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.fontFamily).toBe('Arial');
    });

    it('should return fontFamily from KritzelText', () => {
      setSelectionGroupObjects([createMockText({ fontFamily: 'Courier' })]);

      expect(tool.fontFamily).toBe('Courier');
    });

    it('should return fontFamily from KritzelShape', () => {
      setSelectionGroupObjects([createMockShape({ fontFamily: 'Georgia' })]);

      expect(tool.fontFamily).toBe('Georgia');
    });

    it('should return Arial when no text or shape in selection', () => {
      setSelectionGroupObjects([createMockPath()]);

      expect(tool.fontFamily).toBe('Arial');
    });
  });

  describe('fontFamily setter', () => {
    it('should update fontFamily on KritzelText', () => {
      const text = createMockText();
      setSelectionGroupObjects([text]);

      tool.fontFamily = 'Courier';

      expect(mockCore.updateObject).toHaveBeenCalledWith(text, { fontFamily: 'Courier' });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should update fontFamily on KritzelShape', () => {
      const shape = createMockShape();
      setSelectionGroupObjects([shape]);

      tool.fontFamily = 'Georgia';

      expect(mockCore.updateObject).toHaveBeenCalledWith(shape, { fontFamily: 'Georgia' });
    });
  });

  // ============================================
  // arrows getter / setter
  // ============================================

  describe('arrows getter', () => {
    it('should return default when no lines in selection', () => {
      setSelectionGroupObjects([createMockPath()]);

      expect(tool.arrows).toEqual({ start: { enabled: false }, end: { enabled: false } });
    });

    it('should return arrows from KritzelLine', () => {
      const arrows = { start: { enabled: true }, end: { enabled: false } };
      setSelectionGroupObjects([createMockLine({ arrows })]);

      expect(tool.arrows).toEqual(arrows);
    });
  });

  describe('arrows setter', () => {
    it('should update arrows on KritzelLine', () => {
      const line = createMockLine();
      setSelectionGroupObjects([line]);
      const newArrows = { start: { enabled: false }, end: { enabled: true } };

      tool.arrows = newArrows;

      expect(mockCore.updateObject).toHaveBeenCalledWith(line, { arrows: newArrows });
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should not affect non-line objects', () => {
      const path = createMockPath();
      setSelectionGroupObjects([path]);

      tool.arrows = { start: { enabled: true }, end: { enabled: true } };

      expect(mockCore.updateObject).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // getToolConfig
  // ============================================

  describe('getToolConfig', () => {
    it('should return null when no selection', () => {
      mockCore.store.selectionGroup = null;

      expect(tool.getToolConfig()).toBeNull();
    });

    it('should return null when selection is empty', () => {
      setSelectionGroupObjects([]);

      expect(tool.getToolConfig()).toBeNull();
    });

    it('should return image-only config when only images selected', () => {
      setSelectionGroupObjects([createMockImage()]);

      const config = tool.getToolConfig();

      expect(config).toEqual({
        type: 'selection',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'none',
        sizesSource: 'none',
        controls: [],
      });
    });

    it('should include stroke-size for paths', () => {
      setSelectionGroupObjects([createMockPath()]);

      const config = tool.getToolConfig();

      expect(config!.paletteSource).toBe('palette');
      expect(config!.controls).toContainEqual({ type: 'stroke-size', propertyName: 'size' });
    });

    it('should include stroke-size for lines', () => {
      setSelectionGroupObjects([createMockLine()]);

      const config = tool.getToolConfig();

      expect(config!.controls).toContainEqual({ type: 'stroke-size', propertyName: 'size' });
      expect(config!.controls).toContainEqual({ type: 'line-endings', propertyName: 'arrows' });
    });

    it('should include font-size and font-family for text only', () => {
      setSelectionGroupObjects([createMockText()]);

      const config = tool.getToolConfig();

      expect(config!.controls).toContainEqual({ type: 'font-size', propertyName: 'size' });
      expect(config!.controls).toContainEqual({ type: 'font-family', propertyName: 'fontFamily' });
    });

    it('should include shape-fill for shapes', () => {
      setSelectionGroupObjects([createMockShape()]);

      const config = tool.getToolConfig();

      expect(config!.controls).toContainEqual({ type: 'shape-fill', propertyName: 'fillColor' });
    });

    it('should include stroke-size and font-family when both stroke and text objects', () => {
      setSelectionGroupObjects([createMockPath(), createMockText()]);

      const config = tool.getToolConfig();

      expect(config!.controls).toContainEqual({ type: 'stroke-size', propertyName: 'size' });
      expect(config!.controls).toContainEqual({ type: 'font-family', propertyName: 'fontFamily' });
    });

    it('should include line-endings and shape-fill for mixed selection', () => {
      setSelectionGroupObjects([createMockLine(), createMockShape()]);

      const config = tool.getToolConfig();

      expect(config!.controls).toContainEqual({ type: 'line-endings', propertyName: 'arrows' });
      expect(config!.controls).toContainEqual({ type: 'shape-fill', propertyName: 'fillColor' });
      expect(config!.controls).toContainEqual({ type: 'stroke-size', propertyName: 'size' });
    });
  });

  // ============================================
  // handlePointerDown - Mouse
  // ============================================

  describe('handlePointerDown (mouse)', () => {
    it('should call preventDefault when event is cancelable', () => {
      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when event is not cancelable', () => {
      const event = createMouseEvent({ cancelable: false });

      tool.handlePointerDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should delegate to all handlers for mouse events', () => {
      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(tool.lineHandleHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.resizeHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.rotationHandler.handlePointerDown).toHaveBeenCalledWith(event);
    });

    it('should call rerender for mouse events', () => {
      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should remove selection group when clicking on empty area', () => {
      setSelectionGroupObjects([createMockPath()]);
      mockCore.findObjectById.mockReturnValue(undefined);

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.removeSelectionGroup).toHaveBeenCalled();
    });

    it('should resolve object id when the .object element is the pointer target', () => {
      const objectElement = document.createElement('div');
      objectElement.id = 'custom-1';
      objectElement.classList.add('object');

      mockCore.findObjectById.mockReturnValue(undefined);

      const event = createMouseEvent({
        composedPath: jest.fn().mockReturnValue([objectElement]),
      });

      tool.handlePointerDown(event);

      expect(mockCore.findObjectById).toHaveBeenCalledWith('custom-1');
    });

    it('should not remove selection group when handles are selected', () => {
      setSelectionGroupObjects([createMockPath()]);
      mockState.host.shadowRoot.elementsFromPoint.mockReturnValue([
        { classList: { contains: (cls: string) => cls === 'resize-handle-overlay' } },
      ]);

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
    });

    it('should not process left-click logic for non-left click', () => {
      (KritzelEventHelper.isLeftClick as jest.Mock).mockReturnValue(false);
      setSelectionGroupObjects([createMockPath()]);

      tool.handlePointerDown(createMouseEvent({ button: 2 }));

      // Handlers are still called, but no selection/deselection logic runs
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalled();
      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
    });

    it('should keep current selection group when clicking an already selected dynamic object', () => {
      const customEl = Object.create(KritzelDynamicObject.prototype);
      customEl.__class__ = 'KritzelDynamicObject';
      customEl.id = 'custom-1';
      customEl.hitTest = jest.fn().mockReturnValue(true);

      const objectElement = document.createElement('div');
      objectElement.id = 'custom-1';
      objectElement.classList.add('object');

      setSelectionGroupObjects([customEl]);
      mockCore.findObjectById.mockReturnValue(customEl);

      const event = createMouseEvent({
        composedPath: jest.fn().mockReturnValue([document.createElement('span'), objectElement]),
      });

      tool.handlePointerDown(event);

      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalledWith(event);
    });
  });

  // ============================================
  // handlePointerDown - Touch / Pen
  // ============================================

  describe('handlePointerDown (touch/pen)', () => {
    it('should return early when isScaling is true (touch)', () => {
      mockState.isScaling = true;

      tool.handlePointerDown(createTouchEvent());

      expect(tool.moveHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should return early when isScaling is true (pen)', () => {
      mockState.isScaling = true;

      tool.handlePointerDown(createPenEvent());

      expect(tool.moveHandler.handlePointerDown).not.toHaveBeenCalled();
    });

    it('should delegate to all handlers for touch events', () => {
      mockState.pointers.set(1, {});
      const event = createTouchEvent();

      tool.handlePointerDown(event);

      expect(tool.lineHandleHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.resizeHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.rotationHandler.handlePointerDown).toHaveBeenCalledWith(event);
    });

    it('should call rerender for touch events', () => {
      mockState.pointers.set(1, {});

      tool.handlePointerDown(createTouchEvent());

      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('should remove selection group when tapping empty area with single pointer', () => {
      mockState.pointers.set(1, {});
      setSelectionGroupObjects([createMockPath()]);
      mockCore.findObjectById.mockReturnValue(undefined);

      tool.handlePointerDown(createTouchEvent());

      expect(mockCore.removeSelectionGroup).toHaveBeenCalled();
    });

    it('should treat stale scaling with one pointer as normal touch interaction', () => {
      mockState.isScaling = true;
      mockState.pointers.set(1, {});
      setSelectionGroupObjects([createMockPath()]);
      mockCore.findObjectById.mockReturnValue(undefined);

      tool.handlePointerDown(createTouchEvent());

      expect(mockState.isScaling).toBe(false);
      expect(mockCore.removeSelectionGroup).toHaveBeenCalled();
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalled();
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalled();
    });

    it('should not run selection logic when multiple pointers active', () => {
      mockState.pointers.set(1, {});
      mockState.pointers.set(2, {});
      setSelectionGroupObjects([createMockPath()]);

      tool.handlePointerDown(createTouchEvent());

      // Handlers still called but selection logic skipped
      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerMove - Mouse
  // ============================================

  describe('handlePointerMove (mouse)', () => {
    it('should call preventDefault when event is cancelable', () => {
      const event = createMouseEvent();

      tool.handlePointerMove(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should delegate to all handlers for mouse events', () => {
      const event = createMouseEvent();

      tool.handlePointerMove(event);

      expect(tool.lineHandleHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.moveHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.hoverHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.resizeHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.rotationHandler.handlePointerMove).toHaveBeenCalledWith(event);
    });

    it('should call rerender for mouse events', () => {
      tool.handlePointerMove(createMouseEvent());

      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerMove - Touch / Pen
  // ============================================

  describe('handlePointerMove (touch/pen)', () => {
    it('should return early when isScaling is true', () => {
      mockState.isScaling = true;

      tool.handlePointerMove(createTouchEvent());

      expect(tool.moveHandler.handlePointerMove).not.toHaveBeenCalled();
      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should delegate to all handlers for touch events', () => {
      const event = createTouchEvent();

      tool.handlePointerMove(event);

      expect(tool.lineHandleHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.moveHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.resizeHandler.handlePointerMove).toHaveBeenCalledWith(event);
      expect(tool.rotationHandler.handlePointerMove).toHaveBeenCalledWith(event);
    });

    it('should call rerender for touch events', () => {
      tool.handlePointerMove(createTouchEvent());

      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Mouse
  // ============================================

  describe('handlePointerUp (mouse)', () => {
    it('should call preventDefault when event is cancelable', () => {
      const event = createMouseEvent();

      tool.handlePointerUp(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should delegate to all handlers for mouse events', () => {
      const event = createMouseEvent();

      tool.handlePointerUp(event);

      expect(tool.lineHandleHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.moveHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.resizeHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.rotationHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerUp).toHaveBeenCalledWith(event);
    });

    it('should call rerender for mouse events', () => {
      tool.handlePointerUp(createMouseEvent());

      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  // ============================================
  // handlePointerUp - Touch / Pen
  // ============================================

  describe('handlePointerUp (touch/pen)', () => {
    it('should return early when isScaling is true', () => {
      mockState.isScaling = true;

      tool.handlePointerUp(createTouchEvent());

      expect(tool.moveHandler.handlePointerUp).not.toHaveBeenCalled();
      expect(mockCore.rerender).not.toHaveBeenCalled();
    });

    it('should delegate to all handlers for touch events', () => {
      const event = createTouchEvent();

      tool.handlePointerUp(event);

      expect(tool.lineHandleHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.moveHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.resizeHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.rotationHandler.handlePointerUp).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerUp).toHaveBeenCalledWith(event);
    });

    it('should call rerender for touch events', () => {
      tool.handlePointerUp(createTouchEvent());

      expect(mockCore.rerender).toHaveBeenCalled();
    });
  });

  describe('KritzelDynamicObject interaction semantics', () => {
    it('should allow normal selection/move handlers for unselected dynamic objects', () => {
      const customEl = Object.create(KritzelDynamicObject.prototype);
      customEl.__class__ = 'KritzelDynamicObject';
      customEl.id = 'custom-1';
      customEl.isSelected = false;
      customEl.isInteractive = false;
      (tool as any).getSelectedObject = jest.fn().mockReturnValue({
        id: 'sg-1',
        isSelected: false,
        objects: [customEl],
      });
      mockCore.store.selectionGroup = null;

      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalled();
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalled();
    });

    it('should skip normal handlers for selected single dynamic objects', () => {
      const customEl = Object.create(KritzelDynamicObject.prototype);
      customEl.__class__ = 'KritzelDynamicObject';
      customEl.id = 'custom-1';
      customEl.isSelected = true;
      customEl.isInteractive = false;
      (tool as any).getSelectedObject = jest.fn().mockReturnValue({
        id: 'sg-1',
        isSelected: false,
        objects: [customEl],
      });
      mockCore.store.selectionGroup = {
        id: 'sg-1',
        objects: [customEl],
      } as any;

      const event = createMouseEvent();
      
      tool.handlePointerDown(event);

      expect(tool.lineHandleHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.moveHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.selectionHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.resizeHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.rotationHandler.handlePointerDown).not.toHaveBeenCalled();
    });

    it('should keep handlers active for dynamic objects during multi-selection', () => {
      const customEl = Object.create(KritzelDynamicObject.prototype);
      customEl.__class__ = 'KritzelDynamicObject';
      customEl.id = 'custom-1';
      customEl.isSelected = true;
      customEl.isInteractive = false;

      const other = createMockPath({ id: 'path-2', isSelected: true });
      (tool as any).getSelectedObject = jest.fn().mockReturnValue({
        id: 'sg-1',
        isSelected: false,
        objects: [customEl],
      });
      mockCore.store.selectionGroup = {
        id: 'sg-1',
        objects: [customEl, other],
      } as any;

      const event = createMouseEvent();

      tool.handlePointerDown(event);

      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalled();
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalled();
    });

    it('should not affect KritzelText isInteractive behavior', () => {
      const text = Object.create(KritzelText.prototype);
      text.__class__ = 'KritzelText';
      text.isInteractive = true;

      const selectionGroup = Object.create(Object.prototype);
      selectionGroup.isSelected = false;
      selectionGroup.objects = [text];

      mockState.selectionGroup = selectionGroup;

      const event = createMouseEvent();

      tool.handlePointerDown(event);

      // Text objects with isInteractive=true should still early-return (edit mode)
      // This behavior should remain unchanged
    });
  });
  // ============================================
  // Object titlebar
  // ============================================

  describe('object titlebar', () => {
    const owner = { id: 'owner-1', isInteractive: false } as any;

    beforeEach(() => {
      mockCore.objectTitlebarManager.getOwnerFromEvent.mockReturnValue(owner);
      mockCore.selectObjects = jest.fn((objects: any[]) => {
        mockCore.store.selectionGroup = { id: 'sg-new', objects, objectIds: objects.map(object => object.id) };
      });
    });

    it('selects the owner and starts dragging it in one mouse gesture', () => {
      const event = createMouseEvent({ pointerId: 1 } as Partial<PointerEvent>);

      tool.handlePointerDown(event);

      expect(mockCore.selectObjects).toHaveBeenCalledWith([owner]);
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.resizeHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.rotationHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(mockCore.removeSelectionGroup).not.toHaveBeenCalled();
      expect(tool.selectionHandler.skipEditForPointerId).toBe(1);
      expect(mockCore.rerender).toHaveBeenCalled();
    });

    it('keeps a multi-selection that contains the owner', () => {
      mockCore.store.selectionGroup = { id: 'sg-1', objects: [owner, { id: 'other' }], objectIds: ['owner-1', 'other'] };

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.selectObjects).not.toHaveBeenCalled();
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalled();
    });

    it('promotes a selection inside the owner to the owner', () => {
      mockCore.store.selectionGroup = { id: 'sg-1', objects: [{ id: 'inner' }], objectIds: ['inner'] };

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.selectObjects).toHaveBeenCalledWith([owner]);
    });

    it('toggles the owner with Shift without dragging or starting a marquee', () => {
      tool.handlePointerDown(createMouseEvent({ shiftKey: true } as Partial<PointerEvent>));

      expect(tool.selectionHandler.toggleObjectInSelection).toHaveBeenCalledWith(owner);
      expect(tool.moveHandler.handlePointerDown).not.toHaveBeenCalled();
      expect(tool.selectionHandler.handlePointerDown).not.toHaveBeenCalled();
    });

    it('lets selection handles drawn over a titlebar take precedence', () => {
      jest.spyOn(tool as any, 'isHandleSelected').mockReturnValue(true);

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.objectTitlebarManager.getOwnerFromEvent).not.toHaveBeenCalled();
      expect(tool.resizeHandler.handlePointerDown).toHaveBeenCalled();
    });

    it('selects without dragging when titlebars are not draggable', () => {
      mockCore.objectTitlebarManager.config = { draggable: false };

      tool.handlePointerDown(createMouseEvent());

      expect(mockCore.selectObjects).toHaveBeenCalledWith([owner]);
      expect(tool.moveHandler.handlePointerDown).not.toHaveBeenCalled();
    });

    it('handles single touch presses on titlebars', () => {
      mockState.pointers.set(1, {});
      const event = createTouchEvent({ pointerId: 1 } as Partial<PointerEvent>);

      tool.handlePointerDown(event);

      expect(mockCore.selectObjects).toHaveBeenCalledWith([owner]);
      expect(tool.moveHandler.handlePointerDown).toHaveBeenCalledWith(event);
      expect(tool.selectionHandler.handlePointerDown).not.toHaveBeenCalled();
    });

    it('restores the previous selection when a titlebar touch turns into a pinch', () => {
      const previous = { id: 'sg-previous', objects: [{ id: 'other' }], objectIds: ['other'] };
      mockCore.store.selectionGroup = previous;
      mockState.pointers.set(1, {});
      tool.handlePointerDown(createTouchEvent({ pointerId: 1 } as Partial<PointerEvent>));

      mockState.pointers.set(2, {});
      mockState.isScaling = true;
      tool.handlePointerDown(createTouchEvent({ pointerId: 2 } as Partial<PointerEvent>));

      expect(tool.moveHandler.cancelPendingDrag).toHaveBeenCalled();
      expect(mockCore.addSelectionGroup).toHaveBeenCalledWith(previous);
    });

    it('defers interactivity of embedded owners until the press ends', () => {
      const embedded: any = {
        id: 'embed-1',
        isInteractive: false,
        isSelected: false,
        mount: jest.fn(),
        unmount: jest.fn(),
        hasFocusedInputElement: jest.fn(),
        getEmbeddedContentRoots: jest.fn(() => []),
      };
      embedded.setIsInteractive = jest.fn((value: boolean) => {
        embedded.isInteractive = value;
      });
      mockCore.objectTitlebarManager.getOwnerFromEvent.mockReturnValue(embedded);
      mockCore.selectObjects = jest.fn((objects: any[]) => {
        objects.forEach(object => object.setIsInteractive(true));
        mockCore.store.selectionGroup = { id: 'sg-new', objects, objectIds: objects.map(object => object.id) };
      });

      tool.handlePointerDown(createMouseEvent({ pointerId: 1 } as Partial<PointerEvent>));
      expect(embedded.isInteractive).toBe(false);

      tool.handlePointerUp(createMouseEvent({ pointerId: 1 } as Partial<PointerEvent>));
      expect(embedded.isInteractive).toBe(true);
    });

    it('restores deferred interactivity when the press is cancelled, e.g. by a long-press menu', () => {
      const embedded: any = {
        id: 'embed-1',
        isInteractive: false,
        isSelected: false,
        mount: jest.fn(),
        unmount: jest.fn(),
        hasFocusedInputElement: jest.fn(),
        getEmbeddedContentRoots: jest.fn(() => []),
      };
      embedded.setIsInteractive = jest.fn((value: boolean) => {
        embedded.isInteractive = value;
      });
      mockCore.objectTitlebarManager.getOwnerFromEvent.mockReturnValue(embedded);
      mockCore.selectObjects = jest.fn((objects: any[]) => {
        objects.forEach(object => object.setIsInteractive(true));
        mockCore.store.selectionGroup = { id: 'sg-new', objects, objectIds: objects.map(object => object.id) };
      });

      mockState.pointers.set(1, {});
      tool.handlePointerDown(createTouchEvent({ pointerId: 1 } as Partial<PointerEvent>));
      expect(embedded.isInteractive).toBe(false);

      tool.cancelTitlebarGesture();
      expect(embedded.isInteractive).toBe(true);
    });

    it('clears a titlebar press whose release never arrived on the next press', () => {
      tool.handlePointerDown(createMouseEvent({ pointerId: 1 } as Partial<PointerEvent>));
      mockCore.objectTitlebarManager.getOwnerFromEvent.mockReturnValue(null);

      tool.handlePointerDown(createMouseEvent({ pointerId: 1 } as Partial<PointerEvent>));

      expect(tool.selectionHandler.skipEditForPointerId).toBeNull();
      expect(tool.selectionHandler.handlePointerDown).toHaveBeenCalled();
    });

    describe('title editing', () => {
      beforeEach(() => {
        mockCore.store.selectionGroup = { id: 'sg-1', objects: [owner], objectIds: ['owner-1'] };
        mockCore.objectTitlebarManager.getEditableTitleFromEvent.mockReturnValue({ ownerId: 'owner-1', itemId: 'title' });
      });

      it('starts renaming when the editable title of the selected object is clicked again', () => {
        tool.handlePointerDown(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));
        tool.handlePointerUp(createMouseEvent({ pointerId: 1, clientX: 12, clientY: 11 } as Partial<PointerEvent>));

        expect(mockCore.objectTitlebarManager.startTitleEditing).toHaveBeenCalledWith('owner-1', 'title');
      });

      it('does not rename when the click selected the object', () => {
        mockCore.store.selectionGroup = null;

        tool.handlePointerDown(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));
        tool.handlePointerUp(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));

        expect(mockCore.objectTitlebarManager.startTitleEditing).not.toHaveBeenCalled();
      });

      it('does not rename after a drag or within a multi-selection', () => {
        tool.handlePointerDown(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));
        tool.handlePointerUp(createMouseEvent({ pointerId: 1, clientX: 40, clientY: 10 } as Partial<PointerEvent>));

        mockCore.store.selectionGroup = { id: 'sg-2', objects: [owner, { id: 'other' }], objectIds: ['owner-1', 'other'] };
        tool.handlePointerDown(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));
        tool.handlePointerUp(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));

        expect(mockCore.objectTitlebarManager.startTitleEditing).not.toHaveBeenCalled();
      });

      it('does not rename when the press was not on an editable title', () => {
        mockCore.objectTitlebarManager.getEditableTitleFromEvent.mockReturnValue(null);

        tool.handlePointerDown(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));
        tool.handlePointerUp(createMouseEvent({ pointerId: 1, clientX: 10, clientY: 10 } as Partial<PointerEvent>));

        expect(mockCore.objectTitlebarManager.startTitleEditing).not.toHaveBeenCalled();
      });
    });

    it('clears the titlebar press when the tool is deactivated', () => {
      tool.handlePointerDown(createMouseEvent({ pointerId: 1 } as Partial<PointerEvent>));

      tool.onDeactivate();

      expect(tool.selectionHandler.skipEditForPointerId).toBeNull();
    });
  });
});
