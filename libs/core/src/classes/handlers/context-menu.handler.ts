import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { ContextMenuItem } from '../../interfaces/context-menu-item.interface';
import { KritzelTermKey } from '../../interfaces/localization.interface';

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
   * Resolves the active context menu items for display, translating each item's
   * `label` through the current locale. When the label is a known
   * {@link KritzelTermKey} the translation is used; any other string is passed
   * through unchanged. Runs at menu-open time so the labels reflect the locale
   * active at that moment.
   * @returns A new array of items with resolved labels.
   */
  private resolveLabels(items: ContextMenuItem[]): ContextMenuItem[] {
    return items.map(item => ({
      ...item,
      label: this._core.localizationManager.translate(item.label as KritzelTermKey),
      children: item.children ? this.resolveLabels(item.children) : undefined,
    }));
  }

  /**
   * Gets the active context menu items (object or global) with localized labels.
   */
  private getResolvedContextMenuItems(): ContextMenuItem[] {
    const items = this._core.store.selectionGroup ? this.objectContextMenuItems : this.globalContextMenuItems;
    return this.resolveLabels(items);
  }

  /**
   * Resolves a right-clicked grouped object to its parent group, like a left click does, so menu actions
   * (e.g. ordering) apply to the whole group.
   * @param object - The right-clicked object.
   * @returns The parent group, or the object itself when it is not grouped.
   */
  private resolveSelectableObject(object: KritzelBaseObject<any>): KritzelBaseObject<any> {
    const parentGroup = KritzelGroup.findParentGroup(this._core, object.id);
    if (!parentGroup) {
      return object;
    }

    // Clear the child's own flag so it does not linger as selected.
    object.isSelected = false;
    return parentGroup;
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
    if (this._core.store.state.activeTool?.toolType !== 'selection') {
      return;
    }

    if (this._core.store.state.skipContextMenu) {
      this._core.store.state.skipContextMenu = false;
      return;
    }

    const selectionTool = this._core.store.state.activeTool as KritzelSelectionTool;
    selectionTool?.moveHandler?.cancelPendingDrag();
    selectionTool?.cancelTitlebarGesture?.();

    if (this._core.store.selectionBox) {
      this._core.store.objects.remove(object => object instanceof KritzelSelectionBox);
      this._core.store.setSelectionBox(null);
      this._core.store.state.isSelecting = false;
    }

    // A titlebar stands for its owner. Pressing the titlebar of an already selected object keeps a multi-selection.
    const titlebarOwner = this._core.objectTitlebarManager.getOwnerFromEvent(event, { includeControls: true });
    const isTitlebarOwnerSelected = !!titlebarOwner && !!this._core.store.selectionGroup?.objectIds.includes(titlebarOwner.id);
    const hitObject = titlebarOwner ?? this._core.getObjectFromPointerEvent(event, '.object');

    if (hitObject && !isTitlebarOwnerSelected && !(hitObject instanceof KritzelSelectionGroup) && !(hitObject instanceof KritzelSelectionBox)) {
      const selectedObject = this.resolveSelectableObject(hitObject);
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

    this._core.store.state.contextMenuItems = this.getResolvedContextMenuItems();

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

  /**
   * Programmatically opens the context menu at a specified world-coordinate position.
   * If an objectId is provided and found, the object context menu is shown for that object.
   * If no objectId is provided but a selection group exists, the object context menu is shown.
   * Otherwise, the global context menu is shown.
   * @param options.x - The X position in world (canvas) coordinates.
   * @param options.y - The Y position in world (canvas) coordinates.
   * @param options.objectId - Optional ID of an object to select and show the object context menu for.
   */
  open(options: { x: number; y: number; objectId?: string }): void {
    const { x, y, objectId } = options;

    if (this._core.store.state.activeTool?.toolType === 'selection') {
      const selectionTool = this._core.store.state.activeTool as KritzelSelectionTool;
      selectionTool?.moveHandler?.cancelPendingDrag();
      selectionTool?.cancelTitlebarGesture?.();
    }

    if (this._core.store.selectionBox) {
      this._core.store.objects.remove(object => object instanceof KritzelSelectionBox);
      this._core.store.setSelectionBox(null);
      this._core.store.state.isSelecting = false;
    }

    if (objectId) {
      const targetObject = this._core.store.allObjects.find(obj => obj.id === objectId);
      if (targetObject && !(targetObject instanceof KritzelSelectionGroup) && !(targetObject instanceof KritzelSelectionBox)) {
        const selectionGroup = KritzelSelectionGroup.create(this._core);
        selectionGroup.addOrRemove(targetObject);
        selectionGroup.isSelected = true;
        selectionGroup.rotation = targetObject.rotation;

        this._core.store.state.isSelecting = false;

        const currentSelectionGroup = this._core.store.selectionGroup;
        if (currentSelectionGroup) {
          this._core.removeSelectionGroup();
        }
        this._core.addSelectionGroup(selectionGroup);
      }
    }

    this._core.store.state.contextMenuItems = this.getResolvedContextMenuItems();

    this._core.store.state.contextMenuWorldX = x;
    this._core.store.state.contextMenuWorldY = y;

    const { translateX, translateY, scale } = this._core.store.state;
    let screenX = x * scale + translateX;
    let screenY = y * scale + translateY;

    const menuWidthEstimate = 150;
    const margin = 10;

    if (screenX + menuWidthEstimate > this._core.store.state.viewportWidth - margin) {
      screenX = this._core.store.state.viewportWidth - menuWidthEstimate - margin;
    }

    screenX = Math.max(margin, screenX);
    screenY = Math.max(margin, screenY);

    this._core.store.state.contextMenuX = screenX;
    this._core.store.state.contextMenuY = screenY;
    this._core.store.state.isContextMenuVisible = true;

    this._core.store.state.isEnabled = false;

    this._core.rerender();
  }
}
