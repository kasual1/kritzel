import { KritzelMouseButton } from "../enums/event-button.enum";

export class KritzelClickHelper {

  public static isRightClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.RIGHT;
  }

  public static isLeftClick(ev: MouseEvent): boolean {
    return ev.button === KritzelMouseButton.LEFT;
  }
}
