import { UpdrawMouseButton } from '../enums/event-button.enum';

export class UpdrawEventHelper {
  public static isRightClick(ev: MouseEvent): boolean {
    return ev.button === UpdrawMouseButton.Right;
  }

  public static isLeftClick(ev: MouseEvent): boolean {
    return ev.button === UpdrawMouseButton.Left;
  }

  public static isPointerEventOnContextMenu(event: PointerEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    const contextMenu = path.find(element => element.classList && element.classList.contains('context-menu'));
    return !!contextMenu;
  }

  public static onLongPress(
    event: PointerEvent,
    onSuccess: (event: PointerEvent) => void,
    onCancel?: () => void
  ): () => void {
    if (event.pointerType !== 'touch') {
      onCancel?.();
      return () => { };
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const target = event.target as HTMLElement;

    if (!target) {
      onCancel?.();
      return () => { };
    }

    const longPressTimeout = 400;
    const moveThreshold = 10;

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

  /**
   * Calls a listener and logs what it throws instead of passing it on, so one failing listener neither breaks the
   * caller nor stops the listeners after it. `name` names the listener in the log.
   */
  public static callListener(listener: () => void, name: string): void {
    try {
      listener();
    } catch (error) {
      console.error(`[Updraw] ${name} failed:`, error);
    }
  }
}
