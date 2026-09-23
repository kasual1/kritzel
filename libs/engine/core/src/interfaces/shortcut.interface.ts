import { KritzelCore } from '..';

export interface KritzelShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  category: string;
  condition?: (core: KritzelCore) => boolean;
  action: (core: KritzelCore) => void;
}
