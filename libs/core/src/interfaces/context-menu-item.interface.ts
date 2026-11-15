import { UpmadeBaseObject } from "../classes/objects/base-object.class";
import { UpmadeIconName } from "../classes/registries/icon-registry.class";
import { UpmadeTermKey } from "./localization.interface";

export interface ContextMenuItem {
  /**
   * The item label. Always resolved through the active locale: pass a
   * {@link UpmadeTermKey} (e.g. `'menu.copy'`) to display its translation, or
   * any other string to use it verbatim. Known term keys are autocompleted.
   */
  label: UpmadeTermKey | (string & NonNullable<unknown>);
  action?: (menu: { x: number; y: number }, objects: UpmadeBaseObject[]) => void;
  icon?: UpmadeIconName;
  group?: string;
  children?: ContextMenuItem[];
  isVisible?: boolean | ((menu: { x: number; y: number }, objects: UpmadeBaseObject[]) => boolean | Promise<boolean>);
  isDisabled?: boolean | ((menu: { x: number; y: number }, objects: UpmadeBaseObject[]) => boolean | Promise<boolean>);
}
