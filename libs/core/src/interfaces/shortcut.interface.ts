import { UpdrawCore } from '..';

export interface UpdrawShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  category: string;
  condition?: (core: UpdrawCore) => boolean;
  action: (core: UpdrawCore) => void;
}
