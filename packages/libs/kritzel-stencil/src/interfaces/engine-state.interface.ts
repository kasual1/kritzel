import { KritzelBaseObject } from "../classes/objects/base-object.class";
import { KritzelPath } from "../classes/objects/path.class";
import { KrtizelSelectionBox } from "../classes/objects/selection-box.class";
import { KritzelSelectionGroup } from "../classes/objects/selection-group.class";
import { KritzelHandleType } from "../enums/handle-type.enum";
import { KritzelTool } from "./tool.interface";

export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  copiedObjects?: KritzelSelectionGroup;
  objects: KritzelBaseObject<Element>[];
  selectionBox?: KrtizelSelectionBox;
  selectionGroup?: KritzelSelectionGroup;
  resizeHandleType: KritzelHandleType;
  isSelecting: boolean;
  isResizing: boolean;
  isResizeHandleSelected: boolean;
  isRotating: boolean;
  isRotationHandleSelected: boolean;
  isDragging: boolean;
  isDrawing: boolean;
  isErasing: boolean;
  isCtrlKeyPressed: boolean;
  hasViewportChanged: boolean;
  showDebugInfo: boolean;
  host: HTMLElement;
  cursorX: number;
  cursorY: number;
  scale: number;
  scaleMax: number;
  scaleMin: number;
  scaleStep: number;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
  historyBufferSize: number;
}