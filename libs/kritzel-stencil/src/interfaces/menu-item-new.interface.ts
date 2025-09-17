export interface KritzelMenuItemNew {
  id: string;
  label: string;
  children?: KritzelMenuItemNew[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isChildMenuOpen?: boolean;
  childMenuAnchor?: HTMLElement;
  unchangedState?: Partial<KritzelMenuItemNew>;
}
