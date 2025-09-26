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
    if(this._core.store.state.skipContextMenu) {
      this._core.store.setState('skipContextMenu', false);
      return;
    }


    const selectedObject = this._core.getObjectFromPointerEvent(event, '.object');

    if (selectedObject && !(selectedObject instanceof KritzelSelectionGroup)) {

      const selectionGroup = KritzelSelectionGroup.create(this._core);
      selectionGroup.addOrRemove(selectedObject);
      selectionGroup.isSelected = true;
      selectionGroup.rotation = selectedObject.rotation;

      this._core.store.setState('selectionGroup', selectionGroup);
      this._core.store.setState('isSelecting', false);

      this._core.history.executeCommand(new AddSelectionGroupCommand(this._core, this, this._core.store.state.selectionGroup));
    }

    this._core.store.setState('contextMenuItems', this._core.store.state.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems)

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

    this._core.store.setState('contextMenuX', x);
    this._core.store.setState('contextMenuY', y);
    this._core.store.setState('isContextMenuVisible', true);

    this._core.store.setState('isEnabled', false);

    this._core.rerender();
  }
}
