import { UpdrawBaseObject } from "../classes/objects/base-object.class";
import { UpdrawIconName } from "../classes/registries/icon-registry.class";
import { UpdrawTermKey } from "./localization.interface";

export interface ContextMenuItem {
  /**
   * The item label. Always resolved through the active locale: pass a
   * {@link UpdrawTermKey} (e.g. `'menu.copy'`) to display its translation, or
   * any other string to use it verbatim. Known term keys are autocompleted.
   */
  label: UpdrawTermKey | (string & NonNullable<unknown>);
  action?: (menu: { x: number; y: number }, objects: UpdrawBaseObject[]) => void;
  icon?: UpdrawIconName;
  group?: string;
  children?: ContextMenuItem[];
  isVisible?: boolean | ((menu: { x: number; y: number }, objects: UpdrawBaseObject[]) => boolean | Promise<boolean>);
  isDisabled?: boolean | ((menu: { x: number; y: number }, objects: UpdrawBaseObject[]) => boolean | Promise<boolean>);
}
