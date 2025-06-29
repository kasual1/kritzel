import { KritzelMouseButton } from '../enums/event-button.enum';

export class KritzelEventHelper {
  public static isRightClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.Right;
  }

  public static isLeftClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.Left;
  }

  public static isMainMouseWheel(event: WheelEvent): boolean {
    return Math.abs(event.deltaY) > 0 && Math.abs(event.deltaX) === 0 && Number.isInteger(event.deltaY);
  }

  public static isPointerEventOnContextMenu(event: PointerEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    const contextMenu = path.find(element => element.classList && element.classList.contains('context-menu'));
    return !!contextMenu;
  }

  public static onLongTouchPress(
    event: PointerEvent,
    onSuccess: (event: PointerEvent) => void,
    onCancel?: () => void
  ): () => void {
    if (event.pointerType !== 'touch') {
      onCancel?.();
      return () => {};
    }

    const longPressTimeout = 400;
    const moveThreshold = 10;

    const startX = event.clientX;
    const startY = event.clientY;
    const target = event.target as HTMLElement;

    const timer = setTimeout(() => {
      removeListeners();
      onSuccess(event);
    }, longPressTimeout);

    const cancel = () => {
      clearTimeout(timer);
      removeListeners();
      onCancel?.();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (Math.abs(e.clientX - startX) > moveThreshold || Math.abs(e.clientY - startY) > moveThreshold) {
        cancel();
      }
    };

    const onPointerUp = () => {
      cancel();
    };

    const onPointerCancel = () => {
      cancel();
    };

    const removeListeners = () => {
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerCancel);
    };

    target.addEventListener('pointermove', onPointerMove, { passive: true });
    target.addEventListener('pointerup', onPointerUp, { once: true });
    target.addEventListener('pointercancel', onPointerCancel, { once: true });

    return cancel;
  }

}
