export interface KritzelMenuItemNew {
  label: string;
  children?: KritzelMenuItemNew[];
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
}
