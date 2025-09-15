export interface KritzelMenuItemNew {
  label: string;
  children?: KritzelMenuItemNew[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isChildMenuOpen?: boolean;
  childMenuAnchor?: HTMLElement;
  select?: (item: KritzelMenuItemNew, parent?: KritzelMenuItemNew) => void;
  save?: (item: KritzelMenuItemNew) => void;
  cancel?: (item: KritzelMenuItemNew) => void;
  toggleChildMenu?: (item: KritzelMenuItemNew, childMenuAnchor: HTMLElement) => void;
}
