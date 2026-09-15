
import { KritzelMouseButton } from '../enums/event-button.enum';
import { KritzelEventHelper } from './event.helper';

describe('KritzelEventHelper', () => {
  describe('isRightClick', () => {
    it('should return true if button is right mouse button', () => {
      const event = { button: KritzelMouseButton.Right } as MouseEvent;
      expect(KritzelEventHelper.isRightClick(event)).toBe(true);
    });

    it('should return false if button is not right mouse button', () => {
      const event = { button: KritzelMouseButton.Left } as MouseEvent;
      expect(KritzelEventHelper.isRightClick(event)).toBe(false);
    });
  });

  describe('isLeftClick', () => {
    it('should return true if button is left mouse button', () => {
      const event = { button: KritzelMouseButton.Left } as MouseEvent;
      expect(KritzelEventHelper.isLeftClick(event)).toBe(true);
    });

    it('should return false if button is not left mouse button', () => {
      const event = { button: KritzelMouseButton.Right } as MouseEvent;
      expect(KritzelEventHelper.isLeftClick(event)).toBe(false);
    });
  });

  describe('isPointerEventOnContextMenu', () => {
    it('should return true if event path contains context-menu', () => {
      const contextMenu = document.createElement('div');
      contextMenu.classList.add('context-menu');
      const child = document.createElement('div');
      contextMenu.appendChild(child);

      const event = {
        composedPath: () => [child, contextMenu, document.body, document.documentElement],
      } as unknown as PointerEvent;

      expect(KritzelEventHelper.isPointerEventOnContextMenu(event)).toBe(true);
    });

    it('should return false if event path does not contain context-menu', () => {
      const otherElement = document.createElement('div');
      const event = {
        composedPath: () => [otherElement, document.body, document.documentElement],
      } as unknown as PointerEvent;

      expect(KritzelEventHelper.isPointerEventOnContextMenu(event)).toBe(false);
    });
  });

  describe('onLongTouchPress', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onSuccess after long press timeout for touch event', () => {
      const onSuccess = jest.fn();
      const onCancel = jest.fn();
      const target = document.createElement('div');
      const event = {
        pointerType: 'touch',
        clientX: 10,
        clientY: 10,
        target,
      } as unknown as PointerEvent;

      KritzelEventHelper.onLongPress(event, onSuccess, onCancel);

      expect(onSuccess).not.toHaveBeenCalled();
      jest.advanceTimersByTime(400);
      expect(onSuccess).toHaveBeenCalledWith(event);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should not call onSuccess and call onCancel for non-touch event', () => {
      const onSuccess = jest.fn();
      const onCancel = jest.fn();
      const event = { pointerType: 'mouse' } as PointerEvent;

      KritzelEventHelper.onLongPress(event, onSuccess, onCancel);

      jest.advanceTimersByTime(400);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should return a cancel function that clears the timeout', () => {
      const onSuccess = jest.fn();
      const onCancel = jest.fn();
      const target = document.createElement('div');
      const event = {
        pointerType: 'touch',
        clientX: 10,
        clientY: 10,
        target,
      } as unknown as PointerEvent;

      const cancel = KritzelEventHelper.onLongPress(event, onSuccess, onCancel);
      cancel();

      jest.advanceTimersByTime(400);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });
});

