import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';

export class KritzelContextMenuHandler extends KritzelBaseHandler {
  globalContextMenuItems = [];

  objectContextMenuItems = [];

  constructor(core: KritzelCore, globalContextMenuItems: any[], objectContextMenuItems: any[]) {
    super(core);
    this.globalContextMenuItems = globalContextMenuItems;
    this.objectContextMenuItems = objectContextMenuItems;
  }

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
      this._core.store.state.objects.remove(object => object instanceof KritzelSelectionBox);
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

    let x: number = event.clientX - this._core.store.offsetX;
    let y: number = event.clientY - this._core.store.offsetY;

    const menuWidthEstimate = 150;
    const menuHeightEstimate = 200;
    const margin = 10;

    if (x + menuWidthEstimate > window.innerWidth - margin) {
      x = window.innerWidth - menuWidthEstimate - margin;
    }

    if (y + menuHeightEstimate > window.innerHeight - margin) {
      y = window.innerHeight - menuHeightEstimate - margin;
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
