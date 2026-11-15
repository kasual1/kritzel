import { UpmadeCore } from '..';

export interface UpmadeShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  category: string;
  condition?: (core: UpmadeCore) => boolean;
  action: (core: UpmadeCore) => void;
}
