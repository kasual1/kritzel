import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';

/**
 * Handles context menu interactions on the Kritzel canvas.
 * Manages the display and positioning of context menus, selecting appropriate menu items
 * based on whether an object is targeted or the canvas background is right-clicked.
 */
export class KritzelContextMenuHandler extends KritzelBaseHandler {
  /**
   * Menu items to display when the context menu is opened on the canvas background
   * (i.e., when no object is selected).
   */
  globalContextMenuItems: any[] = [];

  /**
   * Menu items to display when the context menu is opened on a selected object.
   */
  objectContextMenuItems: any[] = [];

  /**
   * Creates a new instance of the context menu handler.
   * @param core - The KritzelCore instance that provides access to canvas state and operations.
   * @param globalContextMenuItems - Array of menu items to show for canvas-level context menus.
   * @param objectContextMenuItems - Array of menu items to show when right-clicking on objects.
   */
  constructor(core: KritzelCore, globalContextMenuItems: any[], objectContextMenuItems: any[]) {
    super(core);
    this.globalContextMenuItems = globalContextMenuItems;
    this.objectContextMenuItems = objectContextMenuItems;
  }

  /**
   * Handles the context menu event (typically triggered by right-click).
   * This method performs the following operations:
   * 1. Validates that the selection tool is active; exits early otherwise.
   * 2. Checks and resets the `skipContextMenu` flag if set.
   * 3. Cancels any pending drag operation on the selection tool.
   * 4. Clears any active selection box if present.
   * 5. If an object is clicked, creates a new selection group containing that object.
   * 6. Determines which menu items to display (object or global context menu).
   * 7. Calculates the menu position, ensuring it stays within viewport bounds.
   * 8. Updates the store state to show the context menu and disables canvas interactions.
   * @param event - The pointer event containing the click coordinates and target information.
   * @returns void - This method does not return a value; it updates state and triggers a rerender.
   */
  handleContextMenu(event: PointerEvent): void {
    if (!(this._core.store.state.activeTool instanceof KritzelSelectionTool)) {
      return;
    }

    if (this._core.store.state.skipContextMenu) {
      this._core.store.state.skipContextMenu = false;
      return;
    }

    const selectionTool = this._core.store.state.activeTool as KritzelSelectionTool;
    selectionTool?.moveHandler?.cancelPendingDrag();

    if (this._core.store.selectionBox) {
      this._core.store.objects.remove(object => object instanceof KritzelSelectionBox);
      this._core.store.setSelectionBox(null);
      this._core.store.state.isSelecting = false;
    }

    const selectedObject = this._core.getObjectFromPointerEvent(event, '.object');

    if (selectedObject && !(selectedObject instanceof KritzelSelectionGroup) && !(selectedObject instanceof KritzelSelectionBox)) {
      const selectionGroup = KritzelSelectionGroup.create(this._core);
      selectionGroup.addOrRemove(selectedObject);
      selectionGroup.isSelected = true;
      selectionGroup.rotation = selectedObject.rotation;

      this._core.store.state.isSelecting = false;

      const currentSelectionGroup = this._core.store.selectionGroup;
      if (currentSelectionGroup) {
        this._core.removeSelectionGroup();
      }
      this._core.addSelectionGroup(selectionGroup);
      this._core.rerender();
    }

    this._core.store.state.contextMenuItems = this._core.store.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems;

    const clickX: number = event.clientX - this._core.store.offsetX;
    const clickY: number = event.clientY - this._core.store.offsetY;

    const { translateX, translateY, scale } = this._core.store.state;
    this._core.store.state.contextMenuWorldX = (clickX - translateX) / scale;
    this._core.store.state.contextMenuWorldY = (clickY - translateY) / scale;

    let x = clickX;
    let y = clickY;

    const menuWidthEstimate = 150;
    const margin = 10;

    if (x + menuWidthEstimate > this._core.store.state.viewportWidth - margin) {
      x = this._core.store.state.viewportWidth - menuWidthEstimate - margin;
    }

    x = Math.max(margin, x);
    y = Math.max(margin, y);

    this._core.store.state.contextMenuX = x;
    this._core.store.state.contextMenuY = y;
    this._core.store.state.isContextMenuVisible = true;

    this._core.store.state.isEnabled = false;

    this._core.rerender();
  }
}
