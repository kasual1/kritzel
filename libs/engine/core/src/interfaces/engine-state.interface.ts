import { KritzelBaseObject } from "../classes/objects/base-object.class";
import { KritzelObjectMap } from "../classes/structures/object-map.structure";
import { KritzelBaseTool } from "../classes/tools/base-tool.class";
import { KritzelWorkspace } from "../classes/core/workspace.class";
import { KritzelHandleType } from "../enums/handle-type.enum";
import { ContextMenuItem } from "./context-menu-item.interface";
import { KritzelDebugInfo } from "./debug-info.interface";
import { LineHandleType } from "../classes/handlers/line-handle.handler";
import { SnapCandidate, SnapPreviewCandidate } from "./anchor.interface";

import { KritzelIconName } from '../classes/registries/icon-registry.class';

export interface KritzelEngineState {
  activeWorkspace: KritzelWorkspace | null | undefined;
  activeTool: KritzelBaseTool | null;
  objects: KritzelObjectMap<KritzelBaseObject<Element>> | null;
  snapCandidate?: SnapCandidate | null;
  snapPreviewCandidate?: SnapPreviewCandidate | null;
  resizeHandleType: KritzelHandleType | undefined;
  lineHandleType: LineHandleType | undefined;
  hasViewportChanged: boolean;
  hasObjectsChanged: boolean;
  isReady: boolean;
  isEnabled: boolean;
  isScaling: boolean;
  isPanning: boolean;
  isSelecting: boolean;
  isResizing: boolean;
  isResizeHandleHovered: boolean;
  isResizeHandleSelected: boolean;
  isRotating: boolean;
  isRotationHandleHovered: boolean;
  isRotationHandleSelected: boolean;
  isLineHandleSelected: boolean;
  isLineHandleDragging: boolean;
  isDragging: boolean;
  isDrawing: boolean;
  isErasing: boolean;
  isWriting: boolean;
  isLoading: boolean;
  isCtrlKeyPressed: boolean;
  isContextMenuVisible: boolean;
  contextMenuItems: ContextMenuItem[];
  contextMenuX: number;
  contextMenuY: number;
  contextMenuWorldX: number;
  contextMenuWorldY: number;
  skipContextMenu: boolean;
  debugInfo: KritzelDebugInfo;
  host: HTMLElement | null;
  pointerX: number;
  pointerY: number;
  scale: number;
  scaleMax: number;
  scaleMin: number;
  startX: number;
  startY: number;
  translateX: number;
  translateXMax: number;
  translateXMin: number;
  translateY: number;
  translateYMax: number;
  translateYMin: number;
  viewportWidth: number;
  viewportHeight: number;
  longTouchTimeout: number | null;
  longTouchDelay: number;
  pointers: Map<number, PointerEvent>;
  workspaces: KritzelWorkspace[];
  cursor: {
    icon: KritzelIconName | 'default';
    iconActive?: KritzelIconName | 'default';
    rotation?: number;
  },
  /** When true, objects are drawn at a fixed visual size regardless of zoom level */
  lockDrawingScale: boolean;
  /** Left boundary of the viewport in world coordinates */
  viewportBoundaryLeft: number;
  /** Right boundary of the viewport in world coordinates */
  viewportBoundaryRight: number;
  /** Top boundary of the viewport in world coordinates */
  viewportBoundaryTop: number;
  /** Bottom boundary of the viewport in world coordinates */
  viewportBoundaryBottom: number;
}