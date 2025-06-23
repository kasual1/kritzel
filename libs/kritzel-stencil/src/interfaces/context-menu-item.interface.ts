export interface ContextMenuItem {
  label: string;
  action: () => void; 
  icon?: string;
  disabled?: boolean | (() => boolean);
}
