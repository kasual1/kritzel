export interface KritzelMenuItem<T = any> {
  value: T;
  label: string;
  select?: (item: KritzelMenuItem) => void;
  save?: (item: KritzelMenuItem) => void;
  cancel?: (item: KritzelMenuItem) => void;
  disabled?: boolean;
  children?: KritzelMenuItem[];
}