import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
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

  handleContextMenu(event: MouseEvent): void {
    if(event.cancelable){
      event.preventDefault();
    }

    if (!(this._store.state.activeTool instanceof KritzelSelectionTool)) {
      return;
    }

    if (this._store.state.skipContextMenu) {
      this._store.state.skipContextMenu = false;
      return;
    }

    this._store.state.contextMenuItems = this._store.state.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems;

    let x: number = event.clientX - this._store.offsetX;
    let y: number = event.clientY - this._store.offsetY;

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

  handleContextMenuTouch(event: TouchEvent): void {
    if(event.cancelable){
      event.preventDefault();
    }

    if (this._store.state.touchCount > 1 || !(this._store.state.activeTool instanceof KritzelSelectionTool)) {
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    const selectedObject = this._store.getObjectFromPointerEvent(event, '.object');

    if (selectedObject && !(selectedObject instanceof KritzelSelectionGroup)) {
      this._store.state.selectionGroup = KritzelSelectionGroup.create(this._store);
      this._store.state.selectionGroup.addOrRemove(selectedObject);
      this._store.state.selectionGroup.selected = true;
      this._store.state.selectionGroup.rotation = selectedObject.rotation;
      this._store.state.isSelecting = false;

      this._store.history.executeCommand(new AddSelectionGroupCommand(this._store, this, this._store.state.selectionGroup));
    }

    this._store.state.contextMenuItems = this._store.state.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems;

    const firstTouch = event.touches[0];

    if (!firstTouch) {
      return;
    }

    let x: number = Math.round(firstTouch.clientX - this._store.offsetX);
    let y: number = Math.round(firstTouch.clientY - this._store.offsetY);

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
