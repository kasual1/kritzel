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
  select?: (item: KritzelMenuItemNew, parent?: KritzelMenuItemNew) => void;
  save?: (item: KritzelMenuItemNew) => void;
  cancel?: (item: KritzelMenuItemNew) => void;
  toggleChildMenu?: (item: KritzelMenuItemNew, childMenuAnchor: HTMLElement) => void;
  closeChildMenu?: (item: KritzelMenuItemNew) => void;
}
