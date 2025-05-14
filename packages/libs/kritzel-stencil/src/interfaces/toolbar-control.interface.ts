import { KritzelBaseTool } from '../classes/tools/base-tool.class';

export interface KritzelToolbarControl {
  type: 'tool' | 'divider' | 'config';
  tool?: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon?: string;
  isDefault?: boolean;
  name: string;
  config?: {
    color?: string;
    size?: number;
    fontFamily?: string;
  };
}
