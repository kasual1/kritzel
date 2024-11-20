import { MouseButton } from "../enums/event-button.enum";

export class ClickHelper {

  public static isRightClick(ev: MouseEvent): boolean {
    return ev.button === MouseButton.RIGHT;
  }

  public static isLeftClick(ev: MouseEvent): boolean {
    return ev.button === MouseButton.LEFT;
  }
}
