export interface ContextMenuItem {
  id: string; // Unique identifier for the action
  label: string;
  icon?: string; // Optional icon name from KritzelIconRegistry
  disabled?: boolean;
}
