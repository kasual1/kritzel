import { UpmadeIconName } from '../classes/registries/icon-registry.class';

export interface IUpmadeMasterDetailItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label for the menu item */
  label: string;
  /** Optional icon name (for upmade-icon) */
  icon?: UpmadeIconName;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface IUpmadeMasterDetailSelectEvent {
  /** The selected item */
  item: IUpmadeMasterDetailItem;
}
