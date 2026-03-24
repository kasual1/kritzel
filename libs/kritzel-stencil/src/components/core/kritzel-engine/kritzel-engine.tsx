import { Component, Host, h, Listen, Element, Prop, Method, State, Event, EventEmitter, Watch } from '@stencil/core';
import { KritzelViewport } from '../../../classes/core/viewport.class';
import { KritzelPath } from '../../../classes/objects/path.class';
import { KritzelLine } from '../../../classes/objects/line.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelImage } from '../../../classes/objects/image.class';
import { KritzelText } from '../../../classes/objects/text.class';
import { KritzelShape } from '../../../classes/objects/shape.class';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
import { KritzelGroup } from '../../../classes/objects/group.class';
import { KritzelSelectionBox } from '../../../classes/objects/selection-box.class';
import { KritzelKeyHandler } from '../../../classes/handlers/key.handler';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelBrushToolConfig, KritzelLineToolConfig, KritzelShapeToolConfig, KritzelTextToolConfig } from '../../../interfaces/toolbar-control.interface';
import { KritzelKeyboardHelper } from '../../../helpers/keyboard.helper';
import { KritzelContextMenuHandler } from '../../../classes/handlers/context-menu.handler';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { KritzelToolRegistry } from '../../../classes/registries/tool.registry';
import { KritzelEventHelper } from '../../../helpers/event.helper';
import { KritzelClassHelper } from '../../../helpers/class.helper';
import { ABSOLUTE_SCALE_MAX, ABSOLUTE_SCALE_MIN } from '../../../constants/engine.constants';
import { KritzelCustomElement } from '../../../classes/objects/custom-element.class';
import { KritzelWorkspace, WORKSPACE_EXPORT_VERSION } from '../../../classes/core/workspace.class';
import { KritzelReviver } from '../../../classes/core/reviver.class';
import { KritzelEngineState } from '../../../interfaces/engine-state.interface';
import { KritzelDebugInfo } from '../../../interfaces/debug-info.interface';
import { KritzelCore } from '../../../classes/core/core.class';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelSyncConfig } from '../../../interfaces/sync-config.interface';
import { throttle } from 'lodash';
import { KritzelColorHelper } from '../../../helpers/color.helper';
import { KritzelSvgExportHelper } from '../../../helpers/svg-export.helper';
import { toPng, toSvg } from 'html-to-image';
import { KritzelUndoState } from '../../../interfaces/undo-state.interface';
import { ThemeName } from '../../../interfaces/theme.interface';
import { KritzelShortcut } from '../../../interfaces/shortcut.interface';
import { KritzelAlignment } from '../../../enums/alignment.enum';
import { KritzelViewportState } from '../../../interfaces/viewport-state.interface';
import { ObjectHelper } from '../../../helpers/object.helper';
import { ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent } from '../../../interfaces/object-change-event.interface';
import { IKritzelUser } from '../../../interfaces/user.interface';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element() host!: HTMLElement;

  /** The workspace to load and display. Changing this prop switches the active workspace. */
  @Prop() workspace?: KritzelWorkspace;
  @Watch('workspace')
  async onWorkspaceChange(newWorkspace: KritzelWorkspace | null) {
    const newWorkspaceId = newWorkspace?.id;

    if (!newWorkspaceId) {
      return;
    }

    // Let batched prop updates settle, then perform an idempotent re-check.
    await Promise.resolve();

    const currentWorkspaceId = this.core.store.state.activeWorkspace?.id;
    if (currentWorkspaceId === newWorkspaceId) {
      return;
    }

    this.core.beforeWorkspaceChange();
    await this.initializeWorkspaceIfNeeded(newWorkspace);
    this.activeWorkspaceChange.emit(this.core.store.state.activeWorkspace);
  }

  /** Optional unique identifier for namespacing storage keys across multiple editor instances. */
  @Prop() editorId?: string;

  /** Optional workspace ID to load. If provided, the engine will look up and load this workspace by ID. */
  @Prop() activeWorkspaceId?: string;
  @Watch('activeWorkspaceId')
  async onActiveWorkspaceIdChange(newWorkspaceId?: string) {
    if (!newWorkspaceId || !this._isYjsInitialized) {
      return;
    }

    await this.switchToWorkspaceById(newWorkspaceId);
  }

  /** Configuration for real-time synchronization providers (e.g., IndexedDB, WebSocket). */
  @Prop() syncConfig?: KritzelSyncConfig;
  @Watch('syncConfig')
  async onSyncConfigChange(newValue: KritzelSyncConfig | undefined) {
    this._syncConfigRevision++;

    // Keep core config in sync immediately so late prop updates are not lost.
    this.core.setSyncConfig(newValue);

    // If syncConfig arrives after componentDidLoad, initialize Yjs now
    if (newValue && !this._isYjsInitialized) {
      await this.initializeSyncAndWorkspace();
    }
  }

  /** The current user for awareness broadcasting (name, id, cursor position). */
  @Prop() user?: IKritzelUser;
  @Watch('user')
  onUserChange(newValue: IKritzelUser | undefined) {
    this.core.setUser(newValue);
  }

  /** Context menu items shown when right-clicking the canvas background. */
  @Prop() globalContextMenuItems: ContextMenuItem[];

  /** Context menu items shown when right-clicking a selected object. */
  @Prop() objectContextMenuItems: ContextMenuItem[];
  /** Maximum zoom scale allowed. Clamped to the absolute maximum defined by the engine. */
  @Prop({ mutable: true }) scaleMax: number = ABSOLUTE_SCALE_MAX;
  @Watch('scaleMax')
  validateScaleMax(newValue: number) {
    if (newValue > ABSOLUTE_SCALE_MAX) {
      console.warn(`scaleMax cannot be greater than ${ABSOLUTE_SCALE_MAX}.`);
      this.scaleMax = ABSOLUTE_SCALE_MAX;
      this.core.store.state.scaleMax = this.scaleMax;
    } else {
      this.core.store.state.scaleMax = newValue;
    }
  }
  /** Minimum zoom scale allowed. Clamped to the absolute minimum defined by the engine. */
  @Prop({ mutable: true }) scaleMin: number = ABSOLUTE_SCALE_MIN;
  @Watch('scaleMin')
  validateScaleMin(newValue: number) {
    if (newValue < ABSOLUTE_SCALE_MIN) {
      console.warn(`scaleMin cannot be less than ${ABSOLUTE_SCALE_MIN}.`);
      this.scaleMin = ABSOLUTE_SCALE_MIN;
      this.core.store.state.scaleMin = this.scaleMin;
    } else {
      this.core.store.state.scaleMin = newValue;
    }
  }
  /** The HTML element to apply cursor styles to. Defaults to `document.body` if not set. */
  @Prop() cursorTarget?: HTMLElement;
  @Watch('cursorTarget')
  onCursorTargetChange(newValue: HTMLElement | undefined) {
    this.core.cursorManager.setTargetElement(newValue || document.body);
  }

  /** When true, objects are drawn at a fixed visual size regardless of zoom level */
  @Prop() lockDrawingScale: boolean = true;
  @Watch('lockDrawingScale')
  onLockDrawingScaleChange(newValue: boolean) {
    this.core.store.state.lockDrawingScale = newValue;
  }

  /** The current theme to apply to the editor */
  @Prop() theme: ThemeName = 'light';
  @Watch('theme')
  onThemeChange(newValue: ThemeName) {
    this.core.themeManager.setTheme(newValue);
  }

  /** Left boundary of the viewport in world coordinates. Objects beyond this X position cannot be panned to. */
  @Prop() viewportBoundaryLeft: number = -Infinity;
  @Watch('viewportBoundaryLeft')
  onViewportBoundaryLeftChange(newValue: number) {
    this.core.store.state.viewportBoundaryLeft = newValue ?? -Infinity;
  }

  /** Right boundary of the viewport in world coordinates. Objects beyond this X position cannot be panned to. */
  @Prop() viewportBoundaryRight: number = Infinity;
  @Watch('viewportBoundaryRight')
  onViewportBoundaryRightChange(newValue: number) {
    this.core.store.state.viewportBoundaryRight = newValue ?? Infinity;
  }

  /** Top boundary of the viewport in world coordinates. Objects beyond this Y position cannot be panned to. */
  @Prop() viewportBoundaryTop: number = -Infinity;
  @Watch('viewportBoundaryTop')
  onViewportBoundaryTopChange(newValue: number) {
    this.core.store.state.viewportBoundaryTop = newValue ?? -Infinity;
  }

  /** Bottom boundary of the viewport in world coordinates. Objects beyond this Y position cannot be panned to. */
  @Prop() viewportBoundaryBottom: number = Infinity;
  @Watch('viewportBoundaryBottom')
  onViewportBoundaryBottomChange(newValue: number) {
    this.core.store.state.viewportBoundaryBottom = newValue ?? Infinity;
  }

  /** Debug info display options controlling which debug overlays are visible */
  @Prop() debugInfo: KritzelDebugInfo;
  @Watch('debugInfo')
  onDebugInfoChange(newValue: KritzelDebugInfo) {
    if (newValue) {
      this.core.store.state.debugInfo = newValue;
    }
  }

  /** When false, wheel events will not trigger viewport pan/zoom. The event still propagates to parent elements. */
  @Prop() wheelEnabled: boolean = true;

  /** Emitted when the engine has fully initialized and is ready for interaction. */
  @Event() isEngineReady: EventEmitter<KritzelEngineState>;

  /** Emitted when the active drawing tool changes. */
  @Event() activeToolChange: EventEmitter<KritzelBaseTool>;

  /** Emitted when the set of selected objects changes. */
  @Event() objectsSelectionChange: EventEmitter<void>;

  /** Emitted when workspaces are created, updated, or deleted. */
  @Event() workspacesChange: EventEmitter<KritzelWorkspace[]>;

  /** Emitted when the active workspace changes (e.g., after import). */
  @Event() activeWorkspaceChange: EventEmitter<KritzelWorkspace>;

  /** Emitted on long-press (touch/pen). Useful for showing custom context menus on mobile. */
  @Event() longpress: EventEmitter<PointerEvent>;

  /** Emitted when objects on the canvas are added, removed, or modified. */
  @Event() objectsChange: EventEmitter<KritzelBaseObject[]>;

  /** Emitted when one or more objects are added to the canvas. */
  @Event() objectsAdded: EventEmitter<ObjectsAddedEvent>;

  /** Emitted when one or more objects are removed from the canvas. */
  @Event() objectsRemoved: EventEmitter<ObjectsRemovedEvent>;

  /** Emitted when one or more objects are updated on the canvas. */
  @Event() objectsUpdated: EventEmitter<ObjectsUpdatedEvent>;

  /** Emitted when the undo/redo state changes, providing current undo availability. */
  @Event() undoStateChange: EventEmitter<KritzelUndoState>;

  /** Emitted when the set of objects visible in the current viewport changes (e.g., after pan or zoom). */
  @Event() objectsInViewportChange: EventEmitter<KritzelBaseObject<Element>[]>;

  /** Emitted when the viewport position, scale, or dimensions change (e.g., after pan, zoom, or resize). */
  @Event() viewportChange: EventEmitter<KritzelViewportState>;

  /** Emitted when the awareness state changes (remote user cursors, presence). */
  @Event() awarenessChange: EventEmitter<Map<number, Record<string, any>>>;

  @State() forceUpdate: number = 0;

  /** Manually triggers the `objectsSelectionChange` event. */
  @Method()
  async triggerSelectionChange() {
    this.objectsSelectionChange.emit();
  }

  @Listen('wheel', { passive: true })
  handleWheel(ev) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (!this.wheelEnabled) {
      return;
    }

    if (this.core.store.state.isContextMenuVisible) {
      this.hideContextMenu();
    }

    this.viewport.handleWheel(ev);
    this.core.store.state?.activeTool?.handleWheel(ev);
  }

  @Listen('pointerdown', { passive: false })
  handlePointerDown(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (KritzelDevicesHelper.isTouchDevice()) {
      KritzelEventHelper.onLongPress(ev, (event: PointerEvent) => this.longpress.emit(event));
    }

    this.host.setPointerCapture(ev.pointerId);
    this.core.store.state.pointers.set(ev.pointerId, ev);

    this.viewport.handlePointerDown(ev);
    this.core.store.state?.activeTool?.handlePointerDown(ev);
  }

  private throttledPointerMoveMulti = throttle((ev: PointerEvent) => {
    this.viewport.handlePointerMove(ev);
    this.core.store.state?.activeTool?.handlePointerMove(ev);
  }, 16);

  @Listen('pointermove', { passive: false })
  handlePointerMove(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (this.core.store.state.pointers.has(ev.pointerId)) {
      this.core.store.state.pointers.set(ev.pointerId, ev);
    }

    if (this.core.store.state.pointers.size > 1) {
      this.throttledPointerMoveMulti(ev);
    }

    // Update cursor for handle hover states using elementsFromPoint
    this.core.cursorManager.updateHoverState(ev);

    this.viewport.handlePointerMove(ev);
    this.core.store.state?.activeTool?.handlePointerMove(ev);
  }

  @Listen('pointerup', { passive: false })
  handlePointerUp(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.core.store.state.pointers.delete(ev.pointerId);
    if (this.host.hasPointerCapture(ev.pointerId)) {
      this.host.releasePointerCapture(ev.pointerId);
    }

    // Reset cursor to default when all pointers are released
    if (this.core.store.state.pointers.size === 0) {
      this.core.cursorManager.resetToDefault();
    }

    this.viewport.handlePointerUp(ev);
    this.core.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('pointercancel', { passive: false })
  handlePointerCancel(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (this.host.hasPointerCapture(ev.pointerId)) {
      this.host.releasePointerCapture(ev.pointerId);
    }
    this.core.store.state.pointers.delete(ev.pointerId);

    // Reset cursor to default when all pointers are released
    if (this.core.store.state.pointers.size === 0) {
      this.core.cursorManager.resetToDefault();
    }

    this.viewport.handlePointerUp(ev);
    this.core.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('pointerleave')
  handlePointerLeave() {
    this.core.store.state.objects?.clearCursorPosition();
  }

  @Listen('longpress', { passive: true })
  handleLongPress(ev: CustomEvent<PointerEvent>) {
    this.contextMenuHandler.handleContextMenu(ev.detail);
  }

  @Listen('contextmenu', { capture: false, passive: false })
  handleContextMenu(ev: PointerEvent) {
    if (ev.cancelable) {
      ev.preventDefault();
    }

    if (this.core.store.isDisabled) {
      return;
    }

    if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
      return;
    }

    this.contextMenuHandler.handleContextMenu(ev);
  }

  @Listen('resize', { target: 'window' })
  handleResize() {
    this.viewport.handleResize();
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev: KeyboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleKeyboardEvent(ev)) {
      return;
    }

    this.keyHandler.handleKeyDown(ev);
  }

  @Listen('keyup', { target: 'window' })
  handleKeyUp(ev: KeyboardEvent) {
    if (this.core.store.isDisabled || !this.shouldHandleKeyboardEvent(ev)) {
      return;
    }

    this.keyHandler.handleKeyUp(ev);
  }

  /**
   * Determines if the engine should handle a keyboard event.
   * Returns true only if:
   * - The event originates from within the engine component, OR
   * - The event target is not an interactive element that needs keyboard input
   *
   * This prevents conflicts with inputs, textareas, dialogs, or other
   * interactive elements that need their own keyboard handling.
   */
  private shouldHandleKeyboardEvent(ev: KeyboardEvent): boolean {
    const path = ev.composedPath();

    // Check if event path includes our host - works reliably with Shadow DOM
    if (path.includes(this.host)) {
      return true;
    }

    // Check if event path includes a dialog (works across Shadow DOM boundaries)
    const isInsideDialog = path.some((el: EventTarget) => {
      if (!(el instanceof HTMLElement)) return false;
      return el.tagName === 'DIALOG' || el.tagName === 'KRITZEL-DIALOG' || el.getAttribute?.('role') === 'dialog' || el.getAttribute?.('role') === 'alertdialog';
    });

    if (isInsideDialog) {
      return false;
    }

    const target = ev.target as HTMLElement;

    // Don't handle if target is an interactive element that needs keyboard input
    if (target.matches?.('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) {
      return false;
    }

    // Handle global shortcuts when no interactive element has focus
    return true;
  }

  @Listen('dblclick', { target: 'document', passive: false })
  preventDoubleTapZoomOnTouchDevices(ev: MouseEvent) {
    if (ev.cancelable) {
      ev.preventDefault();
    }
  }

  /**
   * Registers a new drawing tool with the engine.
   * @param toolName - Unique identifier for the tool (e.g., 'brush', 'eraser').
   * @param toolClass - Constructor class extending `KritzelBaseTool`.
   * @param toolConfig - Optional initial configuration to apply to the tool instance.
   * @returns The registered tool instance, or `null` if registration failed.
   */
  @Method()
  async registerTool(
    toolName: string,
    toolClass: any,
    toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig,
  ): Promise<KritzelBaseTool> {
    if (typeof toolClass !== 'function' || !(toolClass.prototype instanceof KritzelBaseTool)) {
      console.error(`Failed to register tool "${toolName}": Tool class must be a constructor function`);
      return null;
    }

    const registeredTool = KritzelToolRegistry.registerTool(toolName, toolClass, this.core);

    if (toolConfig) {
      Object.entries(toolConfig).forEach(([key, value]) => {
        registeredTool[key] = value;
      });
    }

    return Promise.resolve(registeredTool);
  }

  /**
   * Switches the active drawing tool. Deactivates the current tool and clears any selection.
   * @param tool - The tool instance to activate.
   */
  @Method()
  async changeActiveTool(tool: KritzelBaseTool) {
    if (this.core.store.state.activeTool === tool) {
      return;
    }

    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', tool);
    this.core.deselectAllObjects();
    tool?.onActivate();
  }

  /** Disables all user interaction with the engine (pointer, keyboard, etc.). */
  @Method()
  async disable() {
    this.core.store.state.isEnabled = false;
    this.core.rerender();
  }

  /** Re-enables user interaction after a call to `disable()`. */
  @Method()
  async enable() {
    this.core.store.state.isEnabled = true;
    this.core.rerender();
  }

  /** Deletes the currently selected objects from the canvas. */
  @Method()
  async delete() {
    this.core.delete();
  }

  /** Copies the currently selected objects to the internal clipboard. */
  @Method()
  async copy() {
    this.core.copy();
  }

  /**
   * Pastes previously copied objects at the specified world coordinates.
   * @param x - X position in world coordinates.
   * @param y - Y position in world coordinates.
   */
  @Method()
  async paste(x: number, y: number) {
    this.core.paste(x, y);
  }

  /**
   * Moves an object one layer forward in the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async bringForward(object?: KritzelBaseObject<any>) {
    this.core.bringForward(object);
  }

  /**
   * Moves an object one layer backward in the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async sendBackward(object?: KritzelBaseObject<any>) {
    this.core.sendBackward(object);
  }

  /**
   * Moves an object to the very front of the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async bringToFront(object?: KritzelBaseObject<any>) {
    this.core.bringToFront(object);
  }

  /**
   * Moves an object to the very back of the z-order.
   * @param object - The object to move. If omitted, applies to the current selection.
   */
  @Method()
  async sendToBack(object?: KritzelBaseObject<any>) {
    this.core.sendToBack(object);
  }

  /**
   * Aligns the currently selected objects according to the specified alignment.
   * @param alignment - The alignment direction (e.g., `CenterHorizontal`, `StartVertical`).
   */
  @Method()
  async alignObjects(alignment: KritzelAlignment) {
    this.core.alignObjects(alignment);
  }

  /** Groups the currently selected objects into a single selection group. */
  @Method()
  async group() {
    this.core.group();
  }

  /** Ungroups the currently selected group back into individual objects. */
  @Method()
  async ungroup() {
    this.core.ungroup();
  }

  /** Undoes the last action. */
  @Method()
  async undo() {
    this.core.undo();
  }

  /** Redoes the last undone action. */
  @Method()
  async redo() {
    this.core.redo();
  }

  /** Hides the context menu and resets any associated selection state. */
  @Method()
  async hideContextMenu() {
    this.core.store.state.pointers.clear();
    this.core.store.state.isContextMenuVisible = false;
    this.core.store.state.objects.remove(o => o instanceof KritzelSelectionBox);
    this.core.store.setSelectionBox(null);
    this.core.store.state.isSelecting = false;
    this.core.store.state.isEnabled = true;
    this.core.rerender();
  }

  /**
   * Retrieves a canvas object by its unique ID.
   * @param id - The object's unique identifier.
   * @returns The matching object, or `null` if not found.
   */
  @Method()
  async getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null> {
    const object = this.core.store.allObjects.find(obj => obj.id === id) as T | undefined;
    return object || null;
  }

  /** Returns all objects on the canvas across all layers. */
  @Method()
  async getAllObjects<T extends KritzelBaseObject>(): Promise<T[]> {
    return this.core.store.allObjects as T[];
  }

  /**
   * Returns all objects that match the given predicate function.
   * Excludes internal selection-related objects (selection groups and selection boxes).
   * @param predicate - A filter function called for each object. Return `true` to include.
   * @returns An array of matching objects.
   *
   * @example
   * ```ts
   * // Find all text objects
   * const texts = await engine.findObjects(obj => obj.__class__ === 'KritzelText');
   *
   * // Find objects at a point
   * const hits = await engine.findObjects(obj => obj.hitTest(100, 200));
   *
   * // Combine criteria
   * const filtered = await engine.findObjects(obj => obj.__class__ === 'KritzelPath' && obj.opacity < 0.5);
   * ```
   */
  @Method()
  async findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject) => boolean): Promise<T[]> {
    return this.core.store.allNonSelectionObjects.filter(predicate) as T[];
  }

  /** Returns the total number of objects on the canvas. */
  @Method()
  async getObjectsTotalCount(): Promise<number> {
    return this.core.store.totalObjectCount;
  }

  /**
   * Adds a new object to the canvas. The object will be assigned an ID, core reference, and z-index automatically.
   * @param object - The object instance to add.
   * @returns The added object.
   */
  @Method()
  async addObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.core.deselectAllObjects();

    object.id = object.generateId();
    object._core = this.core;
    object.scale = this.core.store.state.scale;
    object.zIndex = this.core.store.currentZIndex;
    object.workspaceId = this.core.store.state.activeWorkspace.id;

    // Handle KritzelText: recreate the editor now that _core is available
    // The editor's dispatchTransaction callback needs _core for persisting changes
    if (KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText')) {
      const pendingContent = object.content;
      object.editor = object.createEditor();
      if (pendingContent) {
        object.setContent(pendingContent);
      }
    }

    // Handle KritzelGroup: flush pending children into the store
    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup') && object._pendingChildren.length > 0) {
      object.childIds = [];

      // Build a map of old ID → new ID so we can remap anchor references
      const idRemapping = new Map<string, string>();

      object._pendingChildren.forEach(child => {
        const oldId = child.id;
        child.id = child.generateId();
        child._core = this.core;
        child.scale = this.core.store.state.scale;
        child.zIndex = this.core.store.currentZIndex;
        child.workspaceId = this.core.store.state.activeWorkspace.id;

        idRemapping.set(oldId, child.id);
        object.childIds.push(child.id);
      });

      // Remap anchor references in lines before inserting into the store
      object._pendingChildren.forEach(child => {
        if (KritzelClassHelper.isInstanceOf<KritzelLine>(child, 'KritzelLine')) {
          if (child.startAnchor && idRemapping.has(child.startAnchor.objectId)) {
            child.startAnchor = { objectId: idRemapping.get(child.startAnchor.objectId) };
          }
          if (child.endAnchor && idRemapping.has(child.endAnchor.objectId)) {
            child.endAnchor = { objectId: idRemapping.get(child.endAnchor.objectId) };
          }
        }
      });

      object._pendingChildren.forEach(child => {
        this.core.addObject(child);
      });

      object._pendingChildren = [];
      object.finalize();

      // Rebuild anchor index so anchored lines are tracked
      this.core.anchorManager.rebuildIndex();
    }

    this.core.addObject(object);
    this.core.rerender();

    // Wait for the object to be fully rendered and mounted before resolving.
    // First rAF: Stencil processes the render and calls ref callbacks (mount).
    // Second rAF: mounted objects (e.g. KritzelText) run adjustSizeOnInput
    // to compute actual dimensions from the DOM.
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    this.emitObjectsAdded([object]);

    return object;
  }

  /**
   * Updates properties of an existing canvas object.
   * @param object - The object to update.
   * @param updatedProperties - A partial set of properties to apply.
   * @returns The updated object.
   */
  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    this.core.deselectAllObjects();

    this.core.updateObject(object, updatedProperties);
    this.core.rerender();
    this.emitObjectsUpdated([{ object, changedProperties: Object.keys(updatedProperties) }]);

    return object;
  }

  /**
   * Removes an object from the canvas.
   * @param object - The object to remove.
   * @returns The removed object.
   */
  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.core.deselectAllObjects();

    this.core.store.state.objects.remove(o => o.id === object.id);
    this.core.rerender();
    this.emitObjectsRemoved([object]);

    return object;
  }

  /** Returns the currently selected objects. Returns an empty array if nothing is selected. */
  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject<any>[]> {
    const selectionGroup = this.core.store.selectionGroup;
    return selectionGroup ? selectionGroup.objects : [];
  }

  /** Returns all registered keyboard shortcuts (without action/condition) for display in a help UI. */
  @Method()
  async getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]> {
    return this.keyHandler.getDisplayableShortcuts();
  }

  /**
   * Programmatically selects the given objects. Switches to the selection tool automatically.
   * @param objects - The objects to select.
   */
  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.core.deselectAllObjects();
    this.core.selectObjects(objects);
  }

  /** Selects all objects currently visible in the viewport. Switches to the selection tool automatically. */
  @Method()
  async selectAllObjectsInViewport() {
    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.core.deselectAllObjects();
    this.core.selectAllObjectsInViewport();
  }

  /** Deselects all currently selected objects. */
  @Method()
  async clearSelection() {
    this.core.clearSelection();
  }

  /**
   * Pans and zooms the viewport to center on the given object.
   * @param object - The object to center in the viewport.
   * @returns The centered object.
   */
  @Method()
  async centerObjectInViewport(object: KritzelBaseObject) {
    object.centerInViewport();

    this.core.updateObject(object, object);
    this.core.rerender();

    return object;
  }

  /**
   * Pans and zooms the viewport to fit the nearest content, with padding.
   * Useful when the user has panned away from all objects.
   * @returns `true` if content was found and the viewport was adjusted, `false` otherwise.
   */
  @Method()
  async backToContent(): Promise<boolean> {
    return this.viewport.centerFitNearestContent(20);
  }

  /**
   * Pans and zooms the viewport to fit ALL objects on the canvas, including those not currently rendered.
   * Calculates the combined bounding box of all objects and centers the viewport to show them.
   * @param animate - Whether to animate the viewport transition (default: true).
   * @returns `true` if objects were found and the viewport was adjusted, `false` otherwise.
   */
  @Method()
  async centerAllObjects(animate = true): Promise<boolean> {
    return this.viewport.centerFitAllObjects(animate);
  }

  /**
   * Sets the viewport to center on the given world coordinates at the specified scale.
   * @param x - X position in world coordinates to center on.
   * @param y - Y position in world coordinates to center on.
   * @param scale - Target scale level.
   */
  @Method()
  async setViewport(x: number, y: number, scale: number): Promise<void> {
    this.viewport.setViewport(x, y, scale);
  }

  /**
   * Pans the viewport to center on the given world coordinates without changing the scale.
   * @param x - X position in world coordinates to center on.
   * @param y - Y position in world coordinates to center on.
   */
  @Method()
  async panTo(x: number, y: number): Promise<void> {
    this.viewport.panTo(x, y);
  }

  /**
   * Zooms the viewport to the given scale level.
   * Optionally centers on a world point; if omitted, zooms around the viewport center.
   * @param scale - Target scale level.
   * @param worldX - Optional X position in world coordinates to center on.
   * @param worldY - Optional Y position in world coordinates to center on.
   */
  @Method()
  async zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void> {
    this.viewport.zoomTo(scale, worldX, worldY);
  }

  /**
   * Returns the current viewport state including position, scale, and dimensions.
   * @returns The current viewport state.
   */
  @Method()
  async getViewport(): Promise<KritzelViewportState> {
    return this.viewport.getViewport();
  }

  /**
   * Converts screen-relative pixel coordinates to world coordinates.
   * @param x - X position in screen pixels (relative to the engine element).
   * @param y - Y position in screen pixels (relative to the engine element).
   * @returns World coordinates { x, y }.
   */
  @Method()
  async screenToWorld(x: number, y: number): Promise<{ x: number; y: number }> {
    return this.viewport.screenToWorld(x, y);
  }

  /**
   * Converts world coordinates to screen-relative pixel coordinates.
   * @param x - X position in world coordinates.
   * @param y - Y position in world coordinates.
   * @returns Screen coordinates { x, y } relative to the engine element.
   */
  @Method()
  async worldToScreen(x: number, y: number): Promise<{ x: number; y: number }> {
    return this.viewport.worldToScreen(x, y);
  }

  /** Returns the objects currently stored in the internal clipboard from a prior `copy()` call. */
  @Method()
  async getCopiedObjects(): Promise<KritzelBaseObject[]> {
    return this.core.store.state.copiedObjects || [];
  }

  /** Returns all objects currently visible within the viewport bounds. */
  @Method()
  async getObjectsInViewport(): Promise<KritzelBaseObject[]> {
    return this.core.getObjectsInViewport();
  }

  /**
   * Captures a screenshot of the current viewport as a data URL.
   * @param format - The image format: `'png'` (default) or `'svg'`.
   * @returns A data URL string of the captured image.
   */
  @Method()
  async getScreenshot(format: 'png' | 'svg' = 'png'): Promise<string> {
    if (!this.host) return null;

    // Save critical state before screenshot to restore after
    const savedState = {
      objects: this.core.store.state.objects,
      activeWorkspace: this.core.store.state.activeWorkspace,
      workspaces: this.core.store.state.workspaces,
      activeTool: this.core.store.state.activeTool,
      isReady: this.core.store.state.isReady,
      translateX: this.core.store.state.translateX,
      translateY: this.core.store.state.translateY,
      scale: this.core.store.state.scale,
    };

    const options = {
      filter: (node: HTMLElement) => {
        // Exclude the context menu and debug panel from the screenshot
        if (node.tagName === 'KRITZEL-CONTEXT-MENU') {
          return false;
        }
        if (node.classList && node.classList.contains('debug-panel')) {
          return false;
        }
        return true;
      },
    };

    let result: string;
    try {
      if (format === 'svg') {
        result = await toSvg(this.host, options);
      } else {
        result = await toPng(this.host, options);
      }
    } finally {
      // Restore state after screenshot in case cloning caused any side effects
      this.core.store.state.objects = savedState.objects;
      this.core.store.state.activeWorkspace = savedState.activeWorkspace;
      this.core.store.state.workspaces = savedState.workspaces;
      this.core.store.state.activeTool = savedState.activeTool;
      this.core.store.state.isReady = savedState.isReady;
      this.core.store.state.translateX = savedState.translateX;
      this.core.store.state.translateY = savedState.translateY;
      this.core.store.state.scale = savedState.scale;
      this.core.rerender();
    }

    return result;
  }

  /** Exports the current viewport as a PNG file and triggers a browser download. */
  @Method()
  async exportViewportAsPng(): Promise<void> {
    try {
      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      // timestamp format: YYYY-MM-DDTHH-mm-ss-sssZ, clearing colons/dots for safe filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${activeWorkspaceName}-${timestamp}.png`;

      const dataUrl = await this.getScreenshot('png');

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export viewport as PNG:', error);
    }
  }

  /** Exports the current viewport as an SVG file and triggers a browser download. */
  @Method()
  async exportViewportAsSvg(): Promise<void> {
    try {
      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      // timestamp format: YYYY-MM-DDTHH-mm-ss-sssZ, clearing colons/dots for safe filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${activeWorkspaceName}-${timestamp}.svg`;

      const dataUrl = await this.getScreenshot('svg');

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export viewport as SVG:', error);
    }
  }

  /**
   * Generates an SVG string from the currently selected objects.
   * Creates clean, standards-compliant SVG markup by directly serializing object properties.
   * @param options - Optional export settings (theme, padding).
   * @returns SVG markup string, or null if no objects are selected.
   */
  @Method()
  async getSelectedObjectsAsSvgString(options?: { theme?: 'light' | 'dark'; padding?: number }): Promise<string | null> {
    const selectedObjects = await this.getSelectedObjects();
    if (!selectedObjects || selectedObjects.length === 0) {
      return null;
    }

    const theme = options?.theme ?? this.core.themeManager.getStoredTheme();
    return KritzelSvgExportHelper.generateSvg(selectedObjects, {
      theme,
      padding: options?.padding ?? 0,
      includeXmlDeclaration: true,
    });
  }

  /**
   * Exports the currently selected objects as an SVG file and triggers a browser download.
   * Creates clean, standards-compliant SVG markup suitable for import into vector editors.
   * @param options - Optional export settings (theme, padding).
   */
  @Method()
  async exportSelectedObjectsAsSvg(options?: { theme?: 'light' | 'dark'; padding?: number }): Promise<void> {
    try {
      const svgString = await this.getSelectedObjectsAsSvgString(options);
      if (!svgString) {
        console.warn('No objects selected for SVG export');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `selection-${timestamp}.svg`;

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export selected objects as SVG:', error);
    }
  }

  /**
   * Generates a PNG data URL from the currently selected objects.
   * Converts the SVG representation to a rasterized PNG image.
   * @param options - Optional export settings (theme, padding, scale for resolution).
   * @returns PNG data URL string, or null if no objects are selected.
   */
  @Method()
  async getSelectedObjectsAsPngDataUrl(options?: { theme?: 'light' | 'dark'; padding?: number; scale?: number }): Promise<string | null> {
    const svgString = await this.getSelectedObjectsAsSvgString({
      theme: options?.theme,
      padding: options?.padding,
    });

    if (!svgString) {
      return null;
    }

    const scale = options?.scale ?? 2; // Default 2x for better quality

    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for PNG conversion'));
      };

      img.src = url;
    });
  }

  /**
   * Exports the currently selected objects as a PNG file and triggers a browser download.
   * @param options - Optional export settings (theme, padding, scale for resolution).
   */
  @Method()
  async exportSelectedObjectsAsPng(options?: { theme?: 'light' | 'dark'; padding?: number; scale?: number }): Promise<void> {
    try {
      const dataUrl = await this.getSelectedObjectsAsPngDataUrl(options);
      if (!dataUrl) {
        console.warn('No objects selected for PNG export');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `selection-${timestamp}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export selected objects as PNG:', error);
    }
  }

  /**
   * Exports the current workspace and all its objects as a JSON string.
   * The exported data includes workspace metadata (id, name, viewport) and all canvas objects.
   * @returns A JSON string representing the complete workspace state.
   */
  @Method()
  async exportAsJson(): Promise<string> {
    const workspace = this.core.store.state.activeWorkspace;
    const serialized = workspace.serialize({ includeObjects: true });
    return JSON.stringify(serialized, null, 2);
  }

  /**
   * Imports a workspace from a JSON string into a new workspace.
   * Creates a new workspace with the imported data and automatically switches to it.
   * @param json - A JSON string containing workspace data (from exportAsJson).
   * @throws Error if the JSON is invalid or the format version is incompatible.
   */
  @Method()
  async importFromJson(json: string): Promise<void> {
    const data = JSON.parse(json);

    // Validate the import data
    if (!data.__class__ || data.__class__ !== 'KritzelWorkspace') {
      throw new Error('Invalid workspace data: missing or incorrect __class__ identifier');
    }

    if (data.version && data.version !== WORKSPACE_EXPORT_VERSION) {
      console.warn(`Workspace version mismatch: expected ${WORKSPACE_EXPORT_VERSION}, got ${data.version}`);
    }

    // Create a new workspace with a fresh ID but use the imported name
    const newWorkspaceId = ObjectHelper.generateUUID();
    const importedName = data.name || 'Imported Workspace';
    let importedViewport = data.viewport || { centerWorldX: 0, centerWorldY: 0, scale: 1 };

    // Backward compatibility: convert legacy translateX/translateY to centerWorldX/centerWorldY
    if ('translateX' in importedViewport && !('centerWorldX' in importedViewport)) {
      const scale = importedViewport.scale ?? 1;
      importedViewport = {
        centerWorldX: -(importedViewport.translateX ?? 0) / scale,
        centerWorldY: -(importedViewport.translateY ?? 0) / scale,
        scale,
      };
    }

    const newWorkspace = new KritzelWorkspace(newWorkspaceId, importedName, importedViewport);

    // Save the new workspace
    this.core.createWorkspace(newWorkspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);

    // Switch to the new workspace
    this.core.beforeWorkspaceChange();
    await this.core.initializeWorkspace(newWorkspace);

    // Revive and add objects to the new workspace
    if (data.objects && Array.isArray(data.objects)) {
      const reviver = new KritzelReviver(this.core);
      for (const objData of data.objects) {
        const revivedObj = reviver.revive<KritzelBaseObject>(objData);
        if (revivedObj) {
          // Update workspaceId to the new workspace's ID
          revivedObj.workspaceId = newWorkspaceId;
          this.core.addObject(revivedObj);
        }
      }
    }

    // Rerender to apply changes
    this.core.rerender();

    // Emit event so the editor can sync its state
    this.activeWorkspaceChange.emit(newWorkspace);
  }

  /**
   * Loads objects from a workspace JSON string into the current workspace.
   * Unlike importFromJson, this does not create a new workspace - it adds objects to the existing one.
   * Useful for initializing a workspace with pre-existing content after the editor is ready.
   * @param json - A JSON string containing workspace data (from exportAsJson).
   * @returns The number of objects loaded.
   * @throws Error if the JSON is invalid or the format version is incompatible.
   */
  @Method()
  async loadObjectsFromJson(json: string): Promise<number> {
    const data = JSON.parse(json);

    // Validate the import data
    if (!data.__class__ || data.__class__ !== 'KritzelWorkspace') {
      throw new Error('Invalid workspace data: missing or incorrect __class__ identifier');
    }

    if (data.version && data.version !== WORKSPACE_EXPORT_VERSION) {
      console.warn(`Workspace version mismatch: expected ${WORKSPACE_EXPORT_VERSION}, got ${data.version}`);
    }

    const currentWorkspaceId = this.core.store.state.activeWorkspace.id;
    let loadedCount = 0;

    // Revive and add objects to the current workspace
    if (data.objects && Array.isArray(data.objects)) {
      const reviver = new KritzelReviver(this.core);
      for (const objData of data.objects) {
        const revivedObj = reviver.revive<KritzelBaseObject>(objData);
        if (revivedObj) {
          // Update workspaceId to the current workspace's ID
          revivedObj.workspaceId = currentWorkspaceId;
          this.core.addObject(revivedObj);
          loadedCount++;
        }
      }
    }

    // Rerender to apply changes
    this.core.rerender();

    return loadedCount;
  }

  /**
   * Exports the current workspace as a JSON file and triggers a browser download.
   * @param filename - Optional custom filename (without extension). Defaults to workspace name with timestamp.
   */
  @Method()
  async downloadAsJson(filename?: string): Promise<void> {
    try {
      const json = await this.exportAsJson();
      const activeWorkspaceName = this.core.store.state?.activeWorkspace?.name || 'workspace';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFilename = filename || `${activeWorkspaceName}-${timestamp}`;

      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `${finalFilename}.json`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download workspace as JSON:', error);
    }
  }

  /**
   * Opens a file picker dialog and imports the selected JSON file into the workspace.
   * This method creates a hidden file input, triggers the browser's file chooser,
   * reads the selected JSON file, and imports it using importFromJson.
   * @returns A promise that resolves when the import is complete or rejects on error/cancel.
   */
  @Method()
  async importFromFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json,application/json';
      fileInput.style.display = 'none';

      const cleanup = () => {
        fileInput.removeEventListener('change', handleChange);
        fileInput.removeEventListener('cancel', handleCancel);
        document.body.removeChild(fileInput);
      };

      const handleChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          cleanup();
          resolve();
          return;
        }

        try {
          const reader = new FileReader();
          reader.onload = async e => {
            try {
              const json = e.target?.result as string;
              await this.importFromJson(json);
              cleanup();
              resolve();
            } catch (error) {
              cleanup();
              console.error('Failed to import workspace from file:', error);
              reject(error);
            }
          };
          reader.onerror = () => {
            cleanup();
            console.error('Failed to read file:', reader.error);
            reject(reader.error);
          };
          reader.readAsText(file);
        } catch (error) {
          cleanup();
          console.error('Failed to process file:', error);
          reject(error);
        }
      };

      const handleCancel = () => {
        cleanup();
        resolve();
      };

      fileInput.addEventListener('change', handleChange);
      fileInput.addEventListener('cancel', handleCancel);
      document.body.appendChild(fileInput);
      fileInput.click();
    });
  }

  /**
   * Creates a new workspace and emits a `workspacesChange` event.
   * @param workspace - The workspace to create.
   * @returns The created workspace.
   */
  @Method()
  async createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null> {
    await this.core.createWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
    return workspace;
  }

  /**
   * Updates an existing workspace's metadata and emits a `workspacesChange` event.
   * @param workspace - The workspace with updated properties.
   */
  @Method()
  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    await this.core.updateWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
  }

  /**
   * Deletes a workspace and emits a `workspacesChange` event.
   * @param workspace - The workspace to delete.
   */
  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    await this.core.deleteWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
  }

  /** Returns all available workspaces. */
  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return await this.core.getWorkspaces();
  }

  /** Returns the currently active workspace. */
  @Method()
  async getActiveWorkspace(): Promise<KritzelWorkspace> {
    return this.core.store.state.activeWorkspace;
  }

  /**
   * Gets whether the active workspace is publicly accessible.
   * @returns True if the workspace is public, false otherwise
   */
  @Method()
  async getIsPublic(): Promise<boolean> {
    return this.core.getIsPublic();
  }

  /**
   * Loads a shared workspace by token.
   * If the workspace exists locally, it switches to it.
   * If it doesn't exist, it adds it to the local workspaces list and then switches to it.
   * @param token - The connection token identifying the shared workspace
   */
  @Method()
  async loadSharedWorkspace(token: string): Promise<void> {
    const workspaceId = token;

    let workspace = this.core.getWorkspaces().find(w => w.id === workspaceId);

    if (!workspace) {
      workspace = new KritzelWorkspace(workspaceId, 'Shared Workspace');
      workspace.isPublic = true;
      this.core.createWorkspace(workspace);
    } else {
      workspace.isPublic = true;
    }

    this.workspacesChange.emit(this.core.store.state.workspaces);

    this.core.beforeWorkspaceChange();
    await this.initializeWorkspaceIfNeeded(workspace);
    this.activeWorkspaceChange.emit(this.core.store.state.activeWorkspace);
  }

  /**
   * Reinitializes sync by performing a full teardown and re-initialization.
   * Destroys the current Yjs documents and providers, then rebuilds everything
   * from the current syncConfig. Data reloads from IndexedDB nearly instantly.
   * Call this after updating the syncConfig prop (e.g. after authentication state changes).
   */
  @Method()
  async reinitSync(): Promise<void> {
    this.core.setSyncConfig(this.syncConfig);
    this.core.store.state.objects?.clearCursorPosition();
    this.core.store.state.objects?.destroy();
    this.core.appStateMap.destroy();
    this._isYjsInitialized = false;
    await this.initializeSyncAndWorkspace();
  }

  core: KritzelCore;
  viewport: KritzelViewport;
  contextMenuHandler: KritzelContextMenuHandler;
  keyHandler: KritzelKeyHandler;
  contextMenuElement: HTMLKritzelContextMenuElement | null = null;

  private _lastHadSelectionGroup: boolean = false;
  private _isYjsInitialized: boolean = false;
  private _isResolvingActiveWorkspaceId: boolean = false;
  private _stateChangeListenersRegistered: boolean = false;
  private _workspaceInitializationPromise: Promise<void> | null = null;
  private _workspaceInitializationTargetKey: string | null = null;
  private _syncInitPromise: Promise<void> | null = null;
  private _syncConfigRevision: number = 0;

  get isSelecting() {
    return this.core.store.state.activeTool instanceof KritzelSelectionTool && this.core.store.state.isSelecting;
  }

  get isSelectionActive() {
    return this.core.store.state.activeTool instanceof KritzelSelectionTool && this.core.store.selectionGroup !== null;
  }

  constructor() {
    this.core = new KritzelCore(this);
  }

  disconnectedCallback() {
    this.throttledPointerMoveMulti.cancel();

    // Clear cursor position in awareness before destroying
    this.core.store.state.objects?.clearCursorPosition();

    // Clean up current workspace's ObjectMap
    if (this.core.store.state.objects) {
      this.core.store.state.objects.destroy();
    }

    // Clean up AppStateMap (workspaces Y.Doc)
    this.core.appStateMap.destroy();

    // Clean up managers
    this.core.cursorManager.cleanup();
    this.core.themeManager.cleanup();
  }

  componentWillLoad() {
    this.core.setEditorId(this.editorId);
    this.core.setUser(this.user);
    this.validateScaleMax(this.scaleMax);
    this.validateScaleMin(this.scaleMin);
    this.core.store.state.lockDrawingScale = this.lockDrawingScale;
    this.core.store.state.viewportBoundaryLeft = this.viewportBoundaryLeft;
    this.core.store.state.viewportBoundaryRight = this.viewportBoundaryRight;
    this.core.store.state.viewportBoundaryTop = this.viewportBoundaryTop;
    this.core.store.state.viewportBoundaryBottom = this.viewportBoundaryBottom;
  }

  async componentDidLoad() {
    setTimeout(async () => {
      this.contextMenuHandler = new KritzelContextMenuHandler(this.core, this.globalContextMenuItems, this.objectContextMenuItems);
      this.keyHandler = new KritzelKeyHandler(this.core);
      this.viewport = new KritzelViewport(this.core, this.host);

      // Initialize cursor manager with target element and shadow root
      this.core.cursorManager.setTargetElement(this.cursorTarget || document.body);
      this.core.cursorManager.setShadowRoot(this.host.shadowRoot);

      // Initialize theme manager with kritzel-editor as target element
      const editorElement = this.host.closest('kritzel-editor') as HTMLElement;
      this.core.themeManager.setTargetElement(editorElement || this.host);

      // Initialize sync config and Yjs
      await this.initializeSyncAndWorkspace();

      if (this.core.store.state.isReady === false) {
        this.core.store.state.isReady = true;
        this.isEngineReady.emit(this.core.store.state);
      }
    }, 50);
  }

  private async initializeSyncAndWorkspace() {
    // Deduplicate concurrent calls (e.g. @Watch firing during componentWillLoad
    // while componentDidLoad also calls this method).
    if (this._syncInitPromise) {
      return this._syncInitPromise;
    }

    this._syncInitPromise = this.doInitializeSyncAndWorkspace();

    try {
      await this._syncInitPromise;
    } finally {
      this._syncInitPromise = null;
    }
  }

  private async doInitializeSyncAndWorkspace() {
    // Capture sync config revision to detect prop updates that happen while
    // initialization is in-flight.
    const syncConfigRevisionAtStart = this._syncConfigRevision;

    // Always apply the latest sync config (including undefined).
    this.core.setSyncConfig(this.syncConfig);

    // Initialize Yjs document and persistence layer (only once)
    if (!this._isYjsInitialized) {
      await this.core.initializeYjs();

      // If syncConfig changed while initializeYjs was running, replay Yjs
      // initialization once with the latest configuration.
      if (syncConfigRevisionAtStart !== this._syncConfigRevision) {
        this.core.appStateMap.destroy();
        this.core.setSyncConfig(this.syncConfig);
        await this.core.initializeYjs();
      }

      this._isYjsInitialized = true;
    }

    if (this.activeWorkspaceId) {
      const startupWorkspace = this.core.getWorkspaces().find(ws => ws.id === this.activeWorkspaceId);

      if (startupWorkspace) {
        await this.initializeWorkspaceIfNeeded(startupWorkspace);
      } else {
        // Workspace ID was provided but not found – fall back to existing workspaces
        // (last-active, then newest created) instead of leaving activeWorkspace null.
        await this.initializeWorkspaceIfNeeded();
      }
    } else {
      // Resolve startup workspace, preferring explicit workspace object when provided.
      const startupWorkspace = this.resolveStartupWorkspace();
      await this.initializeWorkspaceIfNeeded(startupWorkspace);
    }

    // Emit initial active workspace once startup initialization has completed
    const initialActiveWorkspace = this.core.store.state.activeWorkspace;
    if (initialActiveWorkspace) {
      this.activeWorkspaceChange.emit(initialActiveWorkspace);
    }

    // Register callback for remote workspace changes (only once)
    if (!this._stateChangeListenersRegistered) {
      this.core.appStateMap.onRemoteChange(() => {
        this.workspacesChange.emit(this.core.store.state.workspaces);
        this.tryResolveActiveWorkspaceFromId();
      });
      this._registerStateChangeListeners();
      this._stateChangeListenersRegistered = true;
    }

    this.tryResolveActiveWorkspaceFromId();
  }

  private resolveStartupWorkspace(): KritzelWorkspace | undefined {
    if (this.activeWorkspaceId) {
      const workspaceById = this.core.getWorkspaces().find(ws => ws.id === this.activeWorkspaceId);

      if (workspaceById) {
        return workspaceById;
      }

      console.warn(`[KritzelEngine] No workspace found with ID: ${this.activeWorkspaceId}`);
    }

    return this.workspace;
  }

  private tryResolveActiveWorkspaceFromId(): void {
    if (!this.activeWorkspaceId || this._isResolvingActiveWorkspaceId) {
      return;
    }

    if (this.core.store.state.activeWorkspace?.id === this.activeWorkspaceId) {
      return;
    }

    this._isResolvingActiveWorkspaceId = true;
    void this.switchToWorkspaceById(this.activeWorkspaceId, false).finally(() => {
      this._isResolvingActiveWorkspaceId = false;
    });
  }

  private async switchToWorkspaceById(workspaceId: string, logIfMissing: boolean = true): Promise<void> {
    const workspace = this.core.getWorkspaces().find(ws => ws.id === workspaceId);
    if (!workspace) {
      if (logIfMissing) {
        console.warn(`[KritzelEngine] No workspace found with ID: ${workspaceId}`);
      }
      return;
    }

    if (this.core.store.state.activeWorkspace?.id === workspace.id) {
      return;
    }

    this.core.beforeWorkspaceChange();
    await this.initializeWorkspaceIfNeeded(workspace);
    this.activeWorkspaceChange.emit(this.core.store.state.activeWorkspace);
  }

  private async initializeWorkspaceIfNeeded(workspace?: KritzelWorkspace, options?: { skipFallbackCreation?: boolean }): Promise<void> {
    const targetWorkspaceId = workspace?.id ?? null;
    const targetKey = targetWorkspaceId ?? (options?.skipFallbackCreation ? '__NO_FALLBACK__' : '__AUTO__');

    if (targetWorkspaceId && this.core.store.state.activeWorkspace?.id === targetWorkspaceId) {
      return;
    }

    if (this._workspaceInitializationPromise && this._workspaceInitializationTargetKey === targetKey) {
      await this._workspaceInitializationPromise;
      return;
    }

    const initializationPromise = this.core.initializeWorkspace(workspace, options);
    this._workspaceInitializationPromise = initializationPromise;
    this._workspaceInitializationTargetKey = targetKey;

    try {
      await initializationPromise;
    } finally {
      if (this._workspaceInitializationPromise === initializationPromise) {
        this._workspaceInitializationPromise = null;
        this._workspaceInitializationTargetKey = null;
      }
    }
  }

  emitObjectsChange() {
    const objects = this.core.store.allObjects as KritzelBaseObject<HTMLElement | SVGElement>[];
    const undoState = this.core.store.state.objects.undoState;
    const hasSelectionGroup = this.core.store.selectionGroup !== null;

    this.objectsChange.emit(objects);
    this.undoStateChange.emit(undoState);

    if (this._lastHadSelectionGroup !== hasSelectionGroup) {
      this._lastHadSelectionGroup = hasSelectionGroup;
      this.objectsSelectionChange.emit();
    }
  }

  emitObjectsAdded(objects: KritzelBaseObject<any>[]) {
    this.objectsAdded.emit({ objects });
  }

  emitObjectsRemoved(objects: KritzelBaseObject<any>[]) {
    this.objectsRemoved.emit({ objects });
  }

  emitObjectsUpdated(objects: { object: KritzelBaseObject<any>; changedProperties: string[] }[]) {
    this.objectsUpdated.emit({ objects });
  }

  emitAwarenessChange(states: Map<number, Record<string, any>>) {
    this.awarenessChange.emit(states);
  }

  emitObjectsInViewportChange() {
    const visibleObjects = this.core.store.objectsInViewport;
    this.objectsInViewportChange.emit(visibleObjects);
  }

  private _registerStateChangeListeners() {
    this.core.store.onStateChange('activeTool', this._handleActiveToolChange.bind(this));
  }

  private _handleActiveToolChange(activeTool: KritzelBaseTool) {
    if (!(activeTool instanceof KritzelSelectionTool)) {
      this.core.clearSelection();
      this.core.store.state.objects.remove(o => o instanceof KritzelSelectionBox);
      this.core.store.setSelectionBox(null);
      this.core.store.state.isSelecting = false;
      this.core.store.state.isResizeHandleSelected = false;
      this.core.store.state.isRotationHandleSelected = false;
    }

    this.core.store.state.skipContextMenu = false;
    this.core.store.state.copiedObjects = null;
    this.activeToolChange.emit(activeTool);
    KritzelKeyboardHelper.forceHideKeyboard();

    this.core.rerender();
  }

  render() {
    if (!this.viewport) {
      return null;
    }

    const currentTheme = this.core.themeManager.getStoredTheme();
    const computedStyle = window.getComputedStyle(this.host);
    const baseHandleSizePx = computedStyle.getPropertyValue('--kritzel-selection-handle-size').trim() || '6px';
    const baseHandleSize = parseFloat(baseHandleSizePx);
    const baseHandleTouchSize = baseHandleSize * 2 < 14 ? 14 : baseHandleSize;
    const viewportCenterX = this.core.store.state.viewportWidth / 2 + this.core.store.state.translateX;
    const viewportCenterY = this.core.store.state.viewportHeight / 2 + this.core.store.state.translateY;
    const visibleObjects = this.core.store.objectsInViewport;

    this.core.cursorManager.applyCursor();

    if (this.core.store.state.hasViewportChanged) {
      this.viewportChange.emit(this.viewport.getViewport());
      if (this.core.store.totalObjectCount > 0) {
        this.emitObjectsInViewportChange();
      }
    }

    return (
      <Host>
        {this.core.store.state.debugInfo.showViewportInfo && (
          <div class="debug-panel">
            <div>ActiveWorkspaceId: {this.core.store.state?.activeWorkspace?.id}</div>
            <div>ActiveWorkspaceName: {this.core.store.state?.activeWorkspace?.name}</div>
            <div>TranslateX: {this.core.store.state?.translateX}</div>
            <div>TranslateY: {this.core.store.state?.translateY}</div>
            <div>ViewportWidth: {this.core.store.state?.viewportWidth}</div>
            <div>ViewportHeight: {this.core.store.state?.viewportHeight}</div>
            <div>PointerCount: {this.core.store.state.pointers.size}</div>
            <div>Scale: {this.core.store.state?.scale}</div>
            <div>ActiveTool: {this.core.store.state?.activeTool?.name}</div>
            <div>HasViewportChanged: {this.core.store.state?.hasViewportChanged ? 'true' : 'false'}</div>
            <div>IsEnabled: {this.core.store.state?.isEnabled ? 'true' : 'false'}</div>
            <div>IsScaling: {this.core.store.state?.isScaling ? 'true' : 'false'}</div>
            <div>IsPanning: {this.core.store.state?.isPanning ? 'true' : 'false'}</div>
            <div>IsSelecting: {this.isSelecting ? 'true' : 'false'}</div>
            <div>IsSelectionActive: {this.isSelectionActive ? 'true' : 'false'}</div>
            <div>IsResizeHandleSelected: {this.core.store.state.isResizeHandleSelected ? 'true' : 'false'}</div>
            <div>IsRotationHandleSelected: {this.core.store.state.isRotationHandleSelected ? 'true' : 'false'}</div>
            <div>IsRotationHandleHovered: {this.core.store.state.isRotationHandleHovered ? 'true' : 'false'}</div>
            <div>IsDrawing: {this.core.store.state.isDrawing ? 'true' : 'false'}</div>
            <div>IsWriting: {this.core.store.state.isWriting ? 'true' : 'false'}</div>
            <div>IsPointerDown: {this.core.store.isPointerDown ? 'true' : 'false'}</div>
            <div>PointerX: {this.core.store.state?.pointerX}</div>
            <div>PointerY: {this.core.store.state?.pointerY}</div>
            <div>TotalObjects: {this.core.store.totalObjectCount}</div>
            <div>ObjectsInViewport: {this.core.store.objectsInViewport.length}</div>
            <div>SelectedObjects: {this.core.store.selectionGroup?.objects.length || 0}</div>
            <div>
              ViewportCenter: ({viewportCenterX.toFixed(2)}, {viewportCenterY.toFixed(2)})
            </div>
          </div>
        )}

        <div
          id="origin"
          class="origin"
          style={{
            transform: `matrix(${this.core.store.state?.scale}, 0, 0, ${this.core.store.state?.scale}, ${this.core.store.state?.translateX}, ${this.core.store.state?.translateY})`,
          }}
        >
          {visibleObjects?.map(object => {
            return (
              <div
                key={object.id}
                id={object.id}
                class="object"
                style={{
                  transform: object?.transformationMatrix,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  zIndex: object.zIndex.toString(),
                  pointerEvents: this.core.store.state.isScaling ? 'none' : 'auto',
                }}
              >
                {KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath') && (
                  <svg
                    ref={el => object.mount(el)}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: object?.totalHeight + 'px',
                      width: object?.totalWidth + 'px',
                      left: '0',
                      top: '0',
                      position: 'absolute',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      overflow: 'visible',
                    }}
                    viewBox={object?.viewBox}
                  >
                    <path
                      d={object?.d}
                      fill={KritzelColorHelper.resolveThemeColor(object.fill, currentTheme)}
                      stroke={KritzelColorHelper.resolveThemeColor(object?.stroke, currentTheme)}
                      shape-rendering={object.isLowRes() ? 'optimizeSpeed' : 'auto'}
                    />
                  </svg>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') && (
                  <svg
                    ref={el => object.mount(el)}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: object?.totalHeight + 'px',
                      width: object?.totalWidth + 'px',
                      left: '0',
                      top: '0',
                      position: 'absolute',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      overflow: 'visible',
                    }}
                    viewBox={object?.viewBox}
                  >
                    {(object.hasStartArrow || object.hasEndArrow) && (
                      <defs>
                        {object.hasStartArrow && (
                          <marker
                            id={object.startMarkerId}
                            markerWidth={object.getArrowSize('start')}
                            markerHeight={object.getArrowSize('start')}
                            refX={0}
                            refY={object.getArrowSize('start') / 2}
                            orient="auto-start-reverse"
                            markerUnits="userSpaceOnUse"
                          >
                            <path
                              d={object.getArrowPath(object.arrows?.start?.style)}
                              fill={object.getArrowFill('start')}
                              transform={`scale(${object.getArrowSize('start') / 10})`}
                            />
                          </marker>
                        )}
                        {object.hasEndArrow && (
                          <marker
                            id={object.endMarkerId}
                            markerWidth={object.getArrowSize('end')}
                            markerHeight={object.getArrowSize('end')}
                            refX={0}
                            refY={object.getArrowSize('end') / 2}
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                          >
                            <path d={object.getArrowPath(object.arrows?.end?.style)} fill={object.getArrowFill('end')} transform={`scale(${object.getArrowSize('end') / 10})`} />
                          </marker>
                        )}
                      </defs>
                    )}
                    <path
                      d={this.core.anchorManager.computeClippedLinePath(object)}
                      fill="none"
                      stroke="transparent"
                      stroke-width={Math.max(object?.strokeWidth || 0, 10)}
                      stroke-linecap="round"
                    />
                    <path
                      d={this.core.anchorManager.computeClippedLinePath(object)}
                      fill="none"
                      stroke={KritzelColorHelper.resolveThemeColor(object?.stroke, currentTheme)}
                      stroke-width={object?.strokeWidth}
                      stroke-linecap="round"
                      marker-start={object.hasStartArrow ? `url(#${object.startMarkerId})` : undefined}
                      marker-end={object.hasEndArrow ? `url(#${object.endMarkerId})` : undefined}
                    />
                  </svg>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage') && (
                  <img
                    ref={el => object.mount(el)}
                    src={object.src}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                      borderColor: KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                      padding: object.padding + 'px',
                      overflow: 'visible',
                      userSelect: 'none',
                      imageRendering: this.core.store.state.isScaling || this.core.store.state.isPanning ? 'pixelated' : 'auto',
                    }}
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                  />
                )}

                {KritzelClassHelper.isInstanceOf<KritzelCustomElement>(object, 'KritzelCustomElement') && (
                  <div
                    ref={el => object.mount(el)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                      borderColor: KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                      padding: object.padding + 'px',
                      overflow: 'hidden',
                      display: 'block',
                    }}
                  ></div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') && !this.core.displaySelectionLineUI(object) && (
                  <div
                    ref={el => object.mount(el)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                    }}
                  ></div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelSelectionBox>(object, 'KritzelSelectionBox') && (
                  <div
                    ref={el => object.mount(el)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                      borderColor: KritzelColorHelper.resolveThemeColor(object.borderColor, currentTheme),
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                    }}
                  ></div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText') && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                    }}
                  >
                    <div
                      id="text-object"
                      ref={el => object.mount(el)}
                      onPointerDown={e => object.handlePointerDown(e)}
                      onPointerMove={e => object.handlePointerMove(e)}
                      onPointerUp={e => object.handlePointerUp(e)}
                      style={{
                        minWidth: object.initialWidth + 'px',
                        minHeight: object.initialHeight + 'px',
                        maxWidth: '500px',
                        height: 'auto',
                        width: 'max-content',
                        transformOrigin: 'top left',
                        transform: `scale(${object.scaleFactor})`,
                        backgroundColor: KritzelColorHelper.resolveThemeColor(object.backgroundColor, currentTheme),
                        overflow: 'visible',
                      }}
                    ></div>
                  </div>
                )}

                {KritzelClassHelper.isInstanceOf<KritzelShape>(object, 'KritzelShape') && (
                  <div
                    ref={el => object.mount(el)}
                    onPointerDown={e => object.handlePointerDown(e)}
                    onPointerMove={e => object.handlePointerMove(e)}
                    onPointerUp={e => object.handlePointerUp(e)}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: object.totalWidth + 'px',
                      height: object.totalHeight + 'px',
                      transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                      transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                      opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                      pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                      overflow: 'visible',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                        pointerEvents: 'none',
                      }}
                      viewBox={object.viewBox}
                      preserveAspectRatio="none"
                    >
                      <path
                        d={object.getSvgPath()}
                        fill={KritzelColorHelper.resolveThemeColor(object.fillColor, currentTheme)}
                        stroke={KritzelColorHelper.resolveThemeColor(object.strokeColor, currentTheme)}
                        stroke-width={object.strokeWidth}
                      />
                    </svg>
                    <div
                      ref={el => object.mountTextEditor(el)}
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        overflow: 'hidden',
                        pointerEvents: object.isEditing ? 'auto' : 'none',
                      }}
                    ></div>
                  </div>
                )}

                {this.core.store.state.debugInfo.showObjectInfo && object.isDebugInfoVisible && (
                  <div
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      left: `${object.totalWidth}px`,
                      top: '0',
                      zIndex: (object.zIndex + 2).toString(),
                    }}
                  >
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>Id: {object.id}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>width: {object.width}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>height: {object.height}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>translateX: {object.translateX}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>translateY: {object.translateY}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>rotationDegrees: {object.rotationDegrees}</div>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '10px' }}>zIndex: {object.zIndex}</div>
                  </div>
                )}

                {(this.core.displaySelectionGroupUI(object) || this.core.displaySelectionLineUI(object)) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      zIndex: (object.zIndex + 1).toString(),
                      height: object?.totalHeight.toString(),
                      width: object?.totalWidth.toString(),
                      left: '0',
                      top: '0',
                      position: 'absolute',
                      transform: `rotate(${object.rotationDegrees}deg)`,
                      transformOrigin: `${object.totalWidth / 2}px ${object.totalHeight / 2}px`,
                      overflow: 'visible',
                      pointerEvents: 'none',
                    }}
                  >
                    {this.core.displaySelectionGroupUI(object) && (
                      <g class="selection-group-ui" style={{ pointerEvents: 'none' }}>
                        <g class="selection-group-borders">
                          <line
                            x1="0"
                            y1="0"
                            x2={object.totalWidth}
                            y2="0"
                            style={{
                              stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                              strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                              strokeLinecap: 'square',
                            }}
                          />
                          <line
                            x1="0"
                            y1="0"
                            x2="0"
                            y2={object.totalHeight}
                            style={{
                              stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                              strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                              strokeLinecap: 'square',
                            }}
                          />
                          <line
                            x1="0"
                            y1={object.totalHeight}
                            x2={object.totalWidth}
                            y2={object.totalHeight}
                            style={{
                              stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                              strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                              strokeLinecap: 'square',
                            }}
                          />
                          <line
                            x1={object.totalWidth}
                            y1="0"
                            x2={object.totalWidth}
                            y2={object.totalHeight}
                            style={{
                              stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                              strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                              strokeLinecap: 'square',
                            }}
                          />
                        </g>

                        {!this.isSelecting && (
                          <g class="selection-group-handles" style={{ pointerEvents: 'auto' }}>
                            <rect
                              class="resize-handle top-left"
                              x={`${(-(baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              y={`${(-(baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              width={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <rect
                              class="resize-handle-overlay top-left"
                              x={`${(-baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              y={`${(-baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              width={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />

                            <rect
                              class="resize-handle top-right"
                              x={`${object.totalWidth - ((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              y={`${(-(baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              width={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <rect
                              class="resize-handle-overlay top-right"
                              x={`${object.totalWidth - (baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              y={`${(-baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              width={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />

                            <rect
                              class="resize-handle bottom-left"
                              x={`${(-(baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              y={`${object.totalHeight - ((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              width={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <rect
                              class="resize-handle-overlay bottom-left"
                              x={`${(-baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              y={`${object.totalHeight - (baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              width={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />

                            <rect
                              class="resize-handle bottom-right"
                              x={`${object.totalWidth - ((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              y={`${object.totalHeight - ((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              width={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${((baseHandleSize - 1) * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <rect
                              class="resize-handle-overlay bottom-right"
                              x={`${object.totalWidth - (baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              y={`${object.totalHeight - (baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              width={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              height={`${(baseHandleTouchSize * 2 * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />

                            <line
                              x1={object.totalWidth / 2}
                              y1="0"
                              x2={object.totalWidth / 2}
                              y2={-((15 * object.scale) / this.core.store.state?.scale)}
                              style={{
                                stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                                strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                              }}
                            />
                            <circle
                              class="rotation-handle"
                              cx={object.totalWidth / 2}
                              cy={-((15 * object.scale) / this.core.store.state?.scale)}
                              r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #ffffff)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <circle
                              class="rotation-handle-overlay"
                              cx={object.totalWidth / 2}
                              cy={-((15 * object.scale) / this.core.store.state?.scale)}
                              r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />
                          </g>
                        )}
                      </g>
                    )}

                    {this.core.displaySelectionLineUI(object) && KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') && (
                      <g class="selection-line-ui" style={{ pointerEvents: 'none' }}>
                        <g class="selection-line-borders">
                          <path
                            class="selection-line-border"
                            d={this.core.anchorManager.computeClippedLinePath(object, true)}
                            style={{
                              stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                              strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.store.state?.scale})`,
                              strokeLinecap: 'round',
                              fill: 'none',
                            }}
                          />
                        </g>

                        {!this.isSelecting && (
                          <g class="selection-line-handles" style={{ pointerEvents: 'auto' }}>
                            <circle
                              class="selection-line-handle start"
                              cx={object.startX - object.x}
                              cy={object.startY - object.y}
                              r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #000000)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <circle
                              class="selection-line-handle-overlay start"
                              data-testid="line-handle-start"
                              cx={object.startX - object.x}
                              cy={object.startY - object.y}
                              r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />

                            <circle
                              class="selection-line-handle center"
                              cx={
                                object.controlX !== undefined
                                  ? (object.startX + 2 * object.controlX + object.endX) / 4 - object.x
                                  : (object.startX - object.x + object.endX - object.x) / 2
                              }
                              cy={
                                object.controlY !== undefined
                                  ? (object.startY + 2 * object.controlY + object.endY) / 4 - object.y
                                  : (object.startY - object.y + object.endY - object.y) / 2
                              }
                              r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #000000)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <circle
                              class="selection-line-handle-overlay center"
                              data-testid="line-handle-center"
                              cx={
                                object.controlX !== undefined
                                  ? (object.startX + 2 * object.controlX + object.endX) / 4 - object.x
                                  : (object.startX - object.x + object.endX - object.x) / 2
                              }
                              cy={
                                object.controlY !== undefined
                                  ? (object.startY + 2 * object.controlY + object.endY) / 4 - object.y
                                  : (object.startY - object.y + object.endY - object.y) / 2
                              }
                              r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />

                            <circle
                              class="selection-line-handle end"
                              cx={object.endX - object.x}
                              cy={object.endY - object.y}
                              r={`${((baseHandleSize - 1) * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'var(--kritzel-selection-handle-color, #000000)',
                                stroke: 'var(--kritzel-selection-handle-stroke-color, #007AFF)',
                                strokeWidth: `calc(2px * ${object.scale} / ${this.core.store.state?.scale})`,
                                paintOrder: 'fill',
                              }}
                            />
                            <circle
                              class="selection-line-handle-overlay end"
                              data-testid="line-handle-end"
                              cx={object.endX - object.x}
                              cy={object.endY - object.y}
                              r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                              style={{
                                fill: 'transparent',
                                paintOrder: 'fill',
                              }}
                            />
                          </g>
                        )}
                      </g>
                    )}
                  </svg>
                )}
              </div>
            );
          })}

          {/* Anchor lines for selected line objects - show dashed lines from edge to center */}
          {(() => {
            const data = this.core.anchorManager.getAnchorLinesRenderData();
            if (!data) return null;

            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="anchor-lines"
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none',
                  zIndex: '9998',
                  overflow: 'visible',
                }}
              >
                {data.startAnchorViz && (
                  <g class="anchor-line-start">
                    {data.startAnchorViz.pathD ? (
                      <path
                        d={data.startAnchorViz.pathD}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.3))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                          fill: 'none',
                        }}
                      />
                    ) : (
                      <line
                        x1={data.startAnchorViz.edgeX}
                        y1={data.startAnchorViz.edgeY}
                        x2={data.startAnchorViz.centerX}
                        y2={data.startAnchorViz.centerY}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.3))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                        }}
                      />
                    )}
                    <circle
                      cx={data.startAnchorViz.centerX}
                      cy={data.startAnchorViz.centerY}
                      r={data.indicatorRadius}
                      style={{
                        fill: 'var(--kritzel-snap-indicator-fill, rgba(0, 0, 0))',
                        stroke: 'var(--kritzel-snap-indicator-stroke, #007bff)',
                        strokeWidth: data.indicatorStrokeWidth,
                      }}
                    />
                  </g>
                )}
                {data.endAnchorViz && (
                  <g class="anchor-line-end">
                    {data.endAnchorViz.pathD ? (
                      <path
                        d={data.endAnchorViz.pathD}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                          fill: 'none',
                        }}
                      />
                    ) : (
                      <line
                        x1={data.endAnchorViz.edgeX}
                        y1={data.endAnchorViz.edgeY}
                        x2={data.endAnchorViz.centerX}
                        y2={data.endAnchorViz.centerY}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))',
                          strokeWidth: `${data.lineStrokeWidth}`,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                        }}
                      />
                    )}
                    <circle
                      cx={data.endAnchorViz.centerX}
                      cy={data.endAnchorViz.centerY}
                      r={data.indicatorRadius}
                      style={{
                        fill: 'var(--kritzel-snap-indicator-fill, rgba(59, 130, 246, 0.3))',
                        stroke: 'var(--kritzel-snap-indicator-stroke, #007bff)',
                        strokeWidth: data.indicatorStrokeWidth,
                      }}
                    />
                  </g>
                )}
              </svg>
            );
          })()}

          {/* Snap indicator for line anchoring */}
          {(() => {
            const data = this.core.anchorManager.getSnapIndicatorRenderData();
            if (!data) return null;

            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="snap-indicator"
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none',
                  zIndex: '9999',
                  overflow: 'visible',
                }}
              >
                <g>
                  {/* Dashed line from edge to center */}
                  {/* Dashed line from edge to center */}
                  {data.snapLinePath ? (
                    <path
                      d={data.snapLinePath}
                      fill="none"
                      style={{
                        stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))',
                        strokeWidth: data.lineStrokeWidth,
                        strokeDasharray: data.dashArray,
                        strokeLinecap: 'round',
                      }}
                    />
                  ) : (
                    data.edgeX !== undefined &&
                    data.edgeY !== undefined && (
                      <line
                        x1={data.edgeX}
                        y1={data.edgeY}
                        x2={data.centerX}
                        y2={data.centerY}
                        style={{
                          stroke: 'var(--kritzel-snap-line-stroke, rgba(0, 0, 0, 0.2))',
                          strokeWidth: data.lineStrokeWidth,
                          strokeDasharray: data.dashArray,
                          strokeLinecap: 'round',
                        }}
                      />
                    )
                  )}
                  {/* Center indicator circle */}
                  <circle
                    cx={data.centerX}
                    cy={data.centerY}
                    r={data.indicatorRadius}
                    style={{
                      fill: 'var(--kritzel-snap-indicator-fill, rgba(59, 130, 246, 0.3))',
                      stroke: 'var(--kritzel-snap-indicator-stroke, #007bff)',
                      strokeWidth: data.indicatorStrokeWidth,
                    }}
                  />
                </g>
              </svg>
            );
          })()}
        </div>

        {this.core.store.state.isContextMenuVisible && (
          <kritzel-context-menu
            class="context-menu"
            ref={el => (this.contextMenuElement = el)}
            items={this.core.store.state.contextMenuItems}
            objects={this.core.store.selectionGroup?.objects || []}
            style={{
              position: 'fixed',
              left: `${this.core.store.state.contextMenuX}px`,
              top: `${this.core.store.state.contextMenuY}px`,
              zIndex: '10002',
            }}
            onActionSelected={event => {
              event.detail.action(
                {
                  x: (-this.core.store.state.translateX + this.core.store.state.contextMenuX) / this.core.store.state.scale,
                  y: (-this.core.store.state.translateY + this.core.store.state.contextMenuY) / this.core.store.state.scale,
                },
                this.core.store.selectionGroup?.objects,
              );
              this.hideContextMenu();
            }}
            onClose={() => this.hideContextMenu()}
          ></kritzel-context-menu>
        )}

        {this.core.store.state?.activeTool instanceof KritzelEraserTool && !this.core.store.state.isScaling && <kritzel-cursor-trail core={this.core}></kritzel-cursor-trail>}
      </Host>
    );
  }
}
