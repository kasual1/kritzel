import { UpdrawIconName } from '../classes/registries/icon-registry.class';

export interface IUpdrawMasterDetailItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label for the menu item */
  label: string;
  /** Optional icon name (for updraw-icon) */
  icon?: UpdrawIconName;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface IUpdrawMasterDetailSelectEvent {
  /** The selected item */
  item: IUpdrawMasterDetailItem;
}
