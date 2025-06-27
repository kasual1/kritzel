import { KritzelMouseButton } from '../enums/event-button.enum';

export class KritzelEventHelper {
  private static lastTapTimestamp: number = 0;

  private static tapTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private static doubleTapTimeout: number = 300;

  private static twoFingerTouchDetected: boolean = false;

  public static isRightClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.Right;
  }

  public static isLeftClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.Left;
  }

  public static isMainMouseWheel(event: WheelEvent): boolean {
    return Math.abs(event.deltaY) > 0 && Math.abs(event.deltaX) === 0 && Number.isInteger(event.deltaY);
  }


  public static detectDoubleTap(): boolean {
    const currentTime = Date.now();
    const tapLength = currentTime - KritzelEventHelper.lastTapTimestamp;

    if (KritzelEventHelper.twoFingerTouchDetected) {
      KritzelEventHelper.lastTapTimestamp = 0;
      KritzelEventHelper.twoFingerTouchDetected = false;
      if (KritzelEventHelper.tapTimeoutId) {
        clearTimeout(KritzelEventHelper.tapTimeoutId);
        KritzelEventHelper.tapTimeoutId = null;
      }
      return false;
    }

    if (KritzelEventHelper.tapTimeoutId) {
      clearTimeout(KritzelEventHelper.tapTimeoutId);
      KritzelEventHelper.tapTimeoutId = null;
    }

    if (tapLength < KritzelEventHelper.doubleTapTimeout && tapLength > 0) {
      KritzelEventHelper.lastTapTimestamp = 0;
      return true;
    } else {
      KritzelEventHelper.lastTapTimestamp = currentTime;
      KritzelEventHelper.tapTimeoutId = setTimeout(() => {
        KritzelEventHelper.tapTimeoutId = null;
        KritzelEventHelper.twoFingerTouchDetected = false;
      }, KritzelEventHelper.doubleTapTimeout);
      return false;
    }
  }

  public static notifyTwoFingerTouch(): void {
    KritzelEventHelper.twoFingerTouchDetected = true;
  }
}
