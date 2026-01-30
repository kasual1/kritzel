export interface IKritzelMasterDetailItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label for the menu item */
  label: string;
  /** Optional icon name (for kritzel-icon) */
  icon?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface IKritzelMasterDetailSelectEvent {
  /** The selected item */
  item: IKritzelMasterDetailItem;
}
