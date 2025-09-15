export interface KritzelMenuItemNew {
  label: string;
  children?: KritzelMenuItemNew[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  action?: () => void;
}
