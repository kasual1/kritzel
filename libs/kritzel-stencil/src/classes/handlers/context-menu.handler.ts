import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';

export class KritzelContextMenuHandler extends KritzelBaseHandler {
  globalContextMenuItems = [];

  objectContextMenuItems = [];

  constructor(core: KritzelCore, globalContextMenuItems: any[], objectContextMenuItems: any[]) {
    super(core);
    this.globalContextMenuItems = globalContextMenuItems;
    this.objectContextMenuItems = objectContextMenuItems;
  }

  handleContextMenu(event: PointerEvent): void {
    if(this._core.state.skipContextMenu) {
      this._core.state.skipContextMenu = false;
      return;
    }

    const selectedObject = this._core.getObjectFromPointerEvent(event, '.object');

    if (selectedObject && !(selectedObject instanceof KritzelSelectionGroup)) {
      this._core.state.selectionGroup = KritzelSelectionGroup.create(this._core);
      this._core.state.selectionGroup.addOrRemove(selectedObject);
      this._core.state.selectionGroup.isSelected = true;
      this._core.state.selectionGroup.rotation = selectedObject.rotation;
      this._core.state.isSelecting = false;

      this._core.history.executeCommand(new AddSelectionGroupCommand(this._core, this, this._core.state.selectionGroup));
    }

    this._core.state.contextMenuItems = this._core.state.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems;

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

    this._core.state.contextMenuX = x;
    this._core.state.contextMenuY = y;
    this._core.state.isContextMenuVisible = true;

    this._core.state.isEnabled = false;

    this._core.rerender();
  }
}
