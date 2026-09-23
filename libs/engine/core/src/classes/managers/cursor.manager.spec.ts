import { KritzelCursorManager } from './cursor.manager';
import { KritzelCore } from '../core/core.class';
import { KritzelCursorHelper } from '../../helpers/cursor.helper';

jest.mock('../core/core.class');
jest.mock('../../helpers/cursor.helper');

describe('KritzelCursorManager', () => {
  let manager: KritzelCursorManager;
  let mockCore: any;
  let mockState: any;

  const createMockElement = (): HTMLElement => {
    return {
      style: {
        cursor: '',
        removeProperty: jest.fn(),
        setProperty: jest.fn(),
      },
    } as unknown as HTMLElement;
  };

  const createMockShadowRoot = (elements: Element[] = []): ShadowRoot => {
    return {
      elementsFromPoint: jest.fn().mockReturnValue(elements),
    } as unknown as ShadowRoot;
  };

  const createMockPointerEvent = (overrides: Partial<PointerEvent> = {}): PointerEvent => {
    return {
      clientX: 100,
      clientY: 200,
      ...overrides,
    } as PointerEvent;
  };

  const createMockElementWithClasses = (...classNames: string[]): Element => {
    return {
      classList: {
        contains: jest.fn((name: string) => classNames.includes(name)),
      },
    } as unknown as Element;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockState = {
      cursor: { icon: 'default', iconActive: 'default' },
      pointers: new Map(),
    };

    mockCore = {
      store: {
        get state() { return mockState; },
        get isPointerDown() { return mockState.pointers.size > 0; },
        selectionGroup: null,
      },
    } as unknown as jest.Mocked<KritzelCore>;

    (KritzelCursorHelper.getCursor as jest.Mock).mockReturnValue('url(data:image/svg+xml...) 4 4, auto');
    (KritzelCursorHelper.getPointerCursor as jest.Mock).mockReturnValue('url(data:image/svg+xml...) 12 12, auto');

    manager = new KritzelCursorManager(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // setTargetElement
  // ============================================

  describe('setTargetElement', () => {
    it('should store the target element', () => {
      const element = createMockElement();

      manager.setTargetElement(element);

      expect(manager.getTargetElement()).toBe(element);
    });

    it('should set the pointer cursor CSS variable on the element', () => {
      const element = createMockElement();

      manager.setTargetElement(element);

      expect(element.style.setProperty).toHaveBeenCalledWith(
        '--kritzel-global-default-cursor',
        expect.any(String)
      );
      expect(element.style.setProperty).toHaveBeenCalledWith(
        '--kritzel-global-pointer-cursor',
        expect.any(String)
      );
    });

    it('should reset cursor on previous target element when setting a new one', () => {
      const oldElement = createMockElement();
      const newElement = createMockElement();

      manager.setTargetElement(oldElement);
      manager.setTargetElement(newElement);

      expect(oldElement.style.cursor).toBe('');
      expect(oldElement.style.removeProperty).toHaveBeenCalledWith('--kritzel-global-default-cursor');
      expect(oldElement.style.removeProperty).toHaveBeenCalledWith('--kritzel-global-pointer-cursor');
      expect(manager.getTargetElement()).toBe(newElement);
    });

    it('should handle setting null as target element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);

      manager.setTargetElement(null);

      expect(element.style.cursor).toBe('');
      expect(element.style.removeProperty).toHaveBeenCalledWith('--kritzel-global-default-cursor');
      expect(element.style.removeProperty).toHaveBeenCalledWith('--kritzel-global-pointer-cursor');
      expect(manager.getTargetElement()).toBeNull();
    });

    it('should not set CSS variable when target is null', () => {
      manager.setTargetElement(null);

      // No error thrown, getTargetElement returns null
      expect(manager.getTargetElement()).toBeNull();
    });
  });

  // ============================================
  // getTargetElement
  // ============================================

  describe('getTargetElement', () => {
    it('should return null initially', () => {
      expect(manager.getTargetElement()).toBeNull();
    });

    it('should return the set element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);

      expect(manager.getTargetElement()).toBe(element);
    });
  });

  // ============================================
  // setShadowRoot
  // ============================================

  describe('setShadowRoot', () => {
    it('should store the shadow root for element detection', () => {
      const shadowRoot = createMockShadowRoot();

      manager.setShadowRoot(shadowRoot);

      // Verify it's stored by using updateHoverState which depends on it
      const ev = createMockPointerEvent();
      manager.updateHoverState(ev);
      expect(shadowRoot.elementsFromPoint).toHaveBeenCalled();
    });
  });

  // ============================================
  // resetToDefault
  // ============================================

  describe('resetToDefault', () => {
    it('should reset cursor state to default', () => {
      mockState.cursor = { icon: 'hand', iconActive: 'handGrab', rotation: 45 };

      manager.resetToDefault();

      expect(mockState.cursor).toEqual({ icon: 'default', iconActive: 'default' });
    });
  });

  // ============================================
  // updateHoverState
  // ============================================

  describe('updateHoverState', () => {
    it('should not update when pointer is down', () => {
      mockState.pointers.set(1, {});
      const shadowRoot = createMockShadowRoot();
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent());

      expect(shadowRoot.elementsFromPoint).not.toHaveBeenCalled();
    });

    it('should not update when shadow root is not set', () => {
      const ev = createMockPointerEvent();

      // No error should be thrown
      manager.updateHoverState(ev);
    });

    it('should reset a stale cursor when no elements are found at point', () => {
      mockState.cursor = { icon: 'moveVertical', rotation: -45 };
      const shadowRoot = createMockShadowRoot([]);
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'default', iconActive: 'default' });
    });

    it('should set moveVertical cursor when hovering resize handle overlay', () => {
      const resizeHandle = createMockElementWithClasses('resize-handle-overlay', 'top-left');
      const shadowRoot = createMockShadowRoot([resizeHandle]);
      manager.setShadowRoot(shadowRoot);
      mockCore.store.selectionGroup = { rotationDegrees: 0 };

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'moveVertical', rotation: -45 });
    });

    it('should apply rotation offset of -45 for top-left handle', () => {
      const resizeHandle = createMockElementWithClasses('resize-handle-overlay', 'top-left');
      const shadowRoot = createMockShadowRoot([resizeHandle]);
      manager.setShadowRoot(shadowRoot);
      mockCore.store.selectionGroup = { rotationDegrees: 30 };

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'moveVertical', rotation: 30 + (-45) });
    });

    it('should apply rotation offset of -45 for bottom-right handle', () => {
      const resizeHandle = createMockElementWithClasses('resize-handle-overlay', 'bottom-right');
      const shadowRoot = createMockShadowRoot([resizeHandle]);
      manager.setShadowRoot(shadowRoot);
      mockCore.store.selectionGroup = { rotationDegrees: 0 };

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'moveVertical', rotation: -45 });
    });

    it('should apply rotation offset of 45 for top-right/bottom-left handles', () => {
      const resizeHandle = createMockElementWithClasses('resize-handle-overlay');
      const shadowRoot = createMockShadowRoot([resizeHandle]);
      manager.setShadowRoot(shadowRoot);
      mockCore.store.selectionGroup = { rotationDegrees: 10 };

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'moveVertical', rotation: 10 + 45 });
    });

    it('should default to 0 rotation when selectionGroup is null', () => {
      const resizeHandle = createMockElementWithClasses('resize-handle-overlay');
      const shadowRoot = createMockShadowRoot([resizeHandle]);
      manager.setShadowRoot(shadowRoot);
      mockCore.store.selectionGroup = null;

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'moveVertical', rotation: 45 });
    });

    it('should set hand cursor when hovering rotation handle overlay', () => {
      const rotationHandle = createMockElementWithClasses('rotation-handle-overlay');
      const shadowRoot = createMockShadowRoot([rotationHandle]);
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'hand', iconActive: 'handGrab' });
    });

    it('should set hand cursor when hovering line handle overlay', () => {
      const lineHandle = createMockElementWithClasses('selection-line-handle-overlay');
      const shadowRoot = createMockShadowRoot([lineHandle]);
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'hand', iconActive: 'handGrab' });
    });

    it('should reset cursor when not hovering any handle', () => {
      mockState.cursor = { icon: 'hand', iconActive: 'handGrab' };
      const plainElement = createMockElementWithClasses('some-other-element');
      const shadowRoot = createMockShadowRoot([plainElement]);
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'default', iconActive: 'default' });
    });

    it('should prioritize resize handle over rotation handle', () => {
      const resizeHandle = createMockElementWithClasses('resize-handle-overlay', 'top-left');
      const rotationHandle = createMockElementWithClasses('rotation-handle-overlay');
      const shadowRoot = createMockShadowRoot([resizeHandle, rotationHandle]);
      manager.setShadowRoot(shadowRoot);
      mockCore.store.selectionGroup = { rotationDegrees: 0 };

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'moveVertical', rotation: -45 });
    });

    it('should prioritize rotation handle over line handle', () => {
      const rotationHandle = createMockElementWithClasses('rotation-handle-overlay');
      const lineHandle = createMockElementWithClasses('selection-line-handle-overlay');
      const shadowRoot = createMockShadowRoot([rotationHandle, lineHandle]);
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent());

      expect(mockState.cursor).toEqual({ icon: 'hand', iconActive: 'handGrab' });
    });

    it('should use clientX and clientY from the pointer event', () => {
      const shadowRoot = createMockShadowRoot([]);
      manager.setShadowRoot(shadowRoot);

      manager.updateHoverState(createMockPointerEvent({ clientX: 42, clientY: 99 }));

      expect(shadowRoot.elementsFromPoint).toHaveBeenCalledWith(42, 99);
    });
  });

  // ============================================
  // applyCursor
  // ============================================

  describe('applyCursor', () => {
    it('should apply cursor style to target element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      mockState.cursor = { icon: 'default', iconActive: 'default' };

      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalledWith({
        iconName: 'default',
        rotation: undefined,
      });
      expect(element.style.cursor).toBe('url(data:image/svg+xml...) 4 4, auto');
    });

    it('should use active icon when pointer is down', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      mockState.cursor = { icon: 'hand', iconActive: 'handGrab' };
      mockState.pointers.set(1, {});

      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalledWith({
        iconName: 'handGrab',
        rotation: undefined,
      });
    });

    it('should use normal icon when pointer is not down', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      mockState.cursor = { icon: 'hand', iconActive: 'handGrab' };

      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalledWith({
        iconName: 'hand',
        rotation: undefined,
      });
    });

    it('should pass rotation to getCursor', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      mockState.cursor = { icon: 'moveVertical', rotation: 45 };

      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalledWith({
        iconName: 'moveVertical',
        rotation: 45,
      });
    });

    it('should fall back to icon when iconActive is not set', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      mockState.cursor = { icon: 'hand' };
      mockState.pointers.set(1, {});

      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalledWith({
        iconName: 'hand',
        rotation: undefined,
      });
    });

    it('should not throw when no target element is set', () => {
      mockState.cursor = { icon: 'default' };

      // Should not throw
      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalled();
    });

    it('should handle undefined cursor state', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      mockState.cursor = undefined;

      manager.applyCursor();

      expect(KritzelCursorHelper.getCursor).toHaveBeenCalledWith({
        iconName: undefined,
        rotation: undefined,
      });
    });
  });

  // ============================================
  // cleanup
  // ============================================

  describe('cleanup', () => {
    it('should reset cursor on target element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);

      manager.cleanup();

      expect(element.style.cursor).toBe('');
      expect(element.style.removeProperty).toHaveBeenCalledWith('--kritzel-global-default-cursor');
      expect(element.style.removeProperty).toHaveBeenCalledWith('--kritzel-global-pointer-cursor');
    });

    it('should null out target element and shadow root', () => {
      const element = createMockElement();
      const shadowRoot = createMockShadowRoot();
      manager.setTargetElement(element);
      manager.setShadowRoot(shadowRoot);

      manager.cleanup();

      expect(manager.getTargetElement()).toBeNull();
    });

    it('should not throw when target element is already null', () => {
      manager.cleanup();

      expect(manager.getTargetElement()).toBeNull();
    });

    it('should prevent further hover updates after cleanup', () => {
      const shadowRoot = createMockShadowRoot([createMockElementWithClasses('rotation-handle-overlay')]);
      manager.setShadowRoot(shadowRoot);
      manager.cleanup();

      // After cleanup, shadow root is null, so updateHoverState should be a no-op
      manager.updateHoverState(createMockPointerEvent());

      expect(shadowRoot.elementsFromPoint).not.toHaveBeenCalled();
    });
  });
});
