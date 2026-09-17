import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { KritzelBrushToolConfig, KritzelLineToolConfig, KritzelShapeToolConfig, KritzelTextToolConfig } from './toolbar-item.interface';

export type KritzelToolConstructor = new (...args: any[]) => KritzelBaseTool;

export type KritzelToolConfig = KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig;

export interface KritzelToolDefinition {
  name: string;
  tool: KritzelToolConstructor | KritzelBaseTool;
  config?: KritzelToolConfig;
}export interface KritzelTool {
  name: string;
  toolType: string;
  handlePointerDown(event: PointerEvent): void;
  handlePointerMove(event: PointerEvent): void;
  handlePointerUp(event: PointerEvent): void;
  handleWheel(event: WheelEvent): void;
}
