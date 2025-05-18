import { KritzelMouseButton } from '../enums/event-button.enum';

export class KritzelMouseHelper {
  public static isRightClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.Right;
  }

  public static isLeftClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.Left;
  }

  public static isMainMouseWheel(event: WheelEvent): boolean {
    return Math.abs(event.deltaY) > 0 && Math.abs(event.deltaX) === 0 && Number.isInteger(event.deltaY);
  }
}
