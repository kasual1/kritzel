import { UpmadeBaseObject } from "../classes/objects/base-object.class";
import { UpmadeObjectMap } from "../classes/structures/object-map.structure";
import { UpmadeBaseTool } from "../classes/tools/base-tool.class";
import { UpmadeWorkspace } from "../classes/core/workspace.class";
import { UpmadeHandleType } from "../enums/handle-type.enum";
import { ContextMenuItem } from "./context-menu-item.interface";
import { UpmadeDebugInfo } from "./debug-info.interface";
import { LineHandleType } from "../classes/handlers/line-handle.handler";
import { SnapCandidate, SnapPreviewCandidate } from "./anchor.interface";

import { UpmadeIconName } from '../classes/registries/icon-registry.class';

export interface UpmadeEngineState {
  activeWorkspace: UpmadeWorkspace | null | undefined;
  activeTool: UpmadeBaseTool | null;
  objects: UpmadeObjectMap<UpmadeBaseObject<Element>> | null;
  snapCandidate?: SnapCandidate | null;
  snapPreviewCandidate?: SnapPreviewCandidate | null;
  resizeHandleType: UpmadeHandleType | undefined;
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
  debugInfo: UpmadeDebugInfo;
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
  workspaces: UpmadeWorkspace[];
  cursor: {
    icon: UpmadeIconName | 'default';
    iconActive?: UpmadeIconName | 'default';
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