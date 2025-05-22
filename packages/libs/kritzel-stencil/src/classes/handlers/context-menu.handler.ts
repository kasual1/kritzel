import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelStore } from '../store.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelContextMenuHandler extends KritzelBaseHandler {
  globalContextMenuItems = [];

  objectContextMenuItems = [];

  constructor(store: KritzelStore, globalContextMenuItems: any[], objectContextMenuItems: any[]) {
    super(store);
    this.globalContextMenuItems = globalContextMenuItems;
    this.objectContextMenuItems = objectContextMenuItems;
  }

  handleContextMenu(event: MouseEvent | TouchEvent): void {
    event.preventDefault();

    if (this._store.state.touchCount > 1 || !(this._store.state.activeTool instanceof KritzelSelectionTool)) {
      return;
    }

    if (event instanceof MouseEvent) {
      if (this._store.state.skipContextMenu === true) {
        this._store.state.skipContextMenu = false;
        return;
      }
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    if (event instanceof TouchEvent) {
      const selectedObject = this._store.getObjectFromPointerEvent(event, '.object');

      if (selectedObject) {
        this._store.state.selectionGroup = new KritzelSelectionGroup(this._store);
        this._store.state.selectionGroup.addOrRemove(selectedObject);
        this._store.state.selectionGroup.selected = true;
        this._store.state.selectionGroup.rotation = selectedObject.rotation;
        this._store.state.isSelecting = false;
      }
    }

    this._store.state.contextMenuItems = this._store.state.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems;

    let x: number;
    let y: number;

    if (event instanceof MouseEvent) {
      x = event.clientX;
      y = event.clientY;
    }

    if (event instanceof TouchEvent) {
      const firstTouch = event.touches[0];

      if (!firstTouch) {
        return;
      }

      x = Math.round(firstTouch.clientX - this._store.offsetX);
      y = Math.round(firstTouch.clientY - this._store.offsetY);
    }

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

    this._store.state.contextMenuX = x;
    this._store.state.contextMenuY = y;
    this._store.state.isContextMenuVisible = true;

    this._store.state.isEnabled = false;

    this._store.rerender();
  }
}
