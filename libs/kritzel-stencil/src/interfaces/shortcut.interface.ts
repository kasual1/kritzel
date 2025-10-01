import { KritzelCore } from '..';

export interface KritzelShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  condition?: (core: KritzelCore) => boolean;
  action: (core: KritzelCore) => void;
}
