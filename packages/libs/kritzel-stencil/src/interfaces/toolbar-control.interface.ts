import { KritzelBaseTool } from '../classes/tools/base-tool.class';

export interface KritzelToolbarControl {
  type: 'tool' | 'divider' | 'config';
  tool?: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon?: string;
  isDefault?: boolean;
  name: string;
  config?: KritzelTextToolConfig | KritzelBrushToolConfig;
}

export interface KritzelTextToolConfig {
  color: string;
  size: number;
  fontFamily: string;
}

export interface KritzelBrushToolConfig {
  type: 'pen' | 'highlighter';
  color: string;
  size: number;
}
