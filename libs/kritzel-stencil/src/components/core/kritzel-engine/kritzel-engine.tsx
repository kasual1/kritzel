import { Component, Host, h, Listen, Element, Prop, Method, State, Event, EventEmitter, Watch } from '@stencil/core';
import { KritzelTool } from '../../../interfaces/tool.interface';
import { KritzelViewport } from '../../../classes/core/viewport.class';
import { KritzelPath } from '../../../classes/objects/path.class';
import { KritzelLine } from '../../../classes/objects/line.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelImage } from '../../../classes/objects/image.class';
import { KritzelText } from '../../../classes/objects/text.class';
import { KritzelShape } from '../../../classes/objects/shape.class';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
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
import { KritzelWorkspace } from '../../../classes/core/workspace.class';
import { KritzelEngineState } from '../../../interfaces/engine-state.interface';
import { KritzelCore } from '../../../classes/core/core.class';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelSyncConfig } from '../../../interfaces/sync-config.interface';
import { throttle } from 'lodash';
import { toPng, toSvg } from 'html-to-image';
import { KritzelUndoState } from '../../../interfaces/undo-state.interface';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element() host: HTMLElement;

  @Prop() workspace?: KritzelWorkspace;
  @Prop() syncConfig?: KritzelSyncConfig;
  @Watch('workspace')
  onWorkspaceChange(newWorkspace: KritzelWorkspace | null) {
    const currentWorkspaceId = this.core.store.state.activeWorkspace?.id;
    const newWorkspaceId = newWorkspace?.id;

    if (currentWorkspaceId !== newWorkspaceId) {
      this.core.beforeWorkspaceChange();
      this.core.initializeWorkspace(newWorkspace);
    }
  }
  @Prop() activeTool: KritzelTool;
  @Prop() globalContextMenuItems: ContextMenuItem[];
  @Prop() objectContextMenuItems: ContextMenuItem[];
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

  @Event() isEngineReady: EventEmitter<KritzelEngineState>;
  @Event() activeToolChange: EventEmitter<KritzelBaseTool>;
  @Event() objectsSelectionChange: EventEmitter<void>;
  @Event() workspacesChange: EventEmitter<KritzelWorkspace[]>;
  @Event() longpress: EventEmitter<PointerEvent>;
  @Event() objectsChange: EventEmitter<KritzelBaseObject[]>;
  @Event() undoStateChange: EventEmitter<KritzelUndoState>;
  @Event() objectsInViewportChange: EventEmitter<KritzelBaseObject<Element>[]>;

  @State() forceUpdate: number = 0;

  @Method()
  async triggerSelectionChange() {
    this.objectsSelectionChange.emit();
  }

  @Listen('wheel', { passive: true })
  handleWheel(ev) {
    if (this.core.store.isDisabled) {
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
    this.host.releasePointerCapture(ev.pointerId);

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

    this.host.releasePointerCapture(ev.pointerId);
    this.core.store.state.pointers.delete(ev.pointerId);

    // Reset cursor to default when all pointers are released
    if (this.core.store.state.pointers.size === 0) {
      this.core.cursorManager.resetToDefault();
    }

    this.viewport.handlePointerUp(ev);
    this.core.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('longpress', { passive: true })
  handleLongPress(ev: CustomEvent<PointerEvent>) {
    this.contextMenuHandler.handleContextMenu(ev.detail);
  }

  @Listen('contextmenu', { capture: false })
  handleContextMenu(ev: PointerEvent) {
    ev.preventDefault();

    if (this.core.store.isDisabled) {
      return;
    }

    if (ev.pointerType === 'touch') {
      return;
    }

    this.contextMenuHandler.handleContextMenu(ev);
  }

  @Listen('resize', { target: 'window' })
  handleResize() {
    this.viewport.handleResize();
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.keyHandler.handleKeyDown(ev);
  }

  @Listen('keyup', { target: 'window' })
  handleKeyUp(ev) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.keyHandler.handleKeyUp(ev);
  }

  @Listen('dblclick', { target: 'document' })
  preventDoubleTapZoomOnTouchDevices(ev: MouseEvent) {
    ev.preventDefault();
  }

  @Method()
  async registerTool(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig): Promise<KritzelBaseTool> {
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

  @Method()
  async disable() {
    this.core.store.state.isEnabled = false;
    this.core.rerender();
  }

  @Method()
  async enable() {
    this.core.store.state.isEnabled = true;
    this.core.rerender();
  }

  @Method()
  async delete() {
    this.core.delete();
  }

  @Method()
  async copy() {
    this.core.copy();
  }

  @Method()
  async paste(x: number, y: number) {
    this.core.paste(x, y);
  }

  @Method()
  async bringForward(object?: KritzelBaseObject<any>) {
    this.core.bringForward(object);
  }

  @Method()
  async sendBackward(object?: KritzelBaseObject<any>) {
    this.core.sendBackward(object);
  }

  @Method()
  async bringToFront(object?: KritzelBaseObject<any>) {
    this.core.bringToFront(object);
  }

  @Method()
  async sendToBack(object?: KritzelBaseObject<any>) {
    this.core.sendToBack(object);
  }

  @Method()
  async group() {
    this.core.group();
  }

  @Method()
  async ungroup() {
    this.core.ungroup();
  }

  @Method()
  async undo() {
    this.core.undo();
  }

  @Method()
  async redo() {
    this.core.redo();
  }

  @Method()
  async hideContextMenu() {
    this.core.store.state.pointers.clear();
    this.core.store.state.isContextMenuVisible = false;
    this.core.store.state.objects.remove(o => o instanceof KritzelSelectionBox);
    this.core.store.state.isSelecting = false;
    this.core.store.state.isEnabled = true;
    this.core.rerender();
  }

  @Method()
  async getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null> {
    const object = this.core.store.allObjects.find(obj => obj.id === id) as T | undefined;
    return object || null;
  }

  @Method()
  async addObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.core.deselectAllObjects();

    object.id = object.generateId();
    object._core = this.core;
    object.scale = object.scale ? object.scale : this.core.store.state.scale;
    object.zIndex = this.core.store.currentZIndex;

    this.core.addObject(object);
    this.core.rerender();

    return object;
  }

  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    this.core.deselectAllObjects();

    this.core.updateObject(object, updatedProperties);
    this.core.rerender();

    return object;
  }

  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.core.deselectAllObjects();

    this.core.store.state.objects.remove(o => o.id === object.id);
    this.core.rerender();

    return object;
  }

  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject<any>[]> {
    const selectionGroup = this.core.store.selectionGroup;
    return selectionGroup ? selectionGroup.objects : [];
  }

  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.core.deselectAllObjects();
    this.core.selectObjects(objects);
  }

  @Method()
  async selectAllObjectsInViewport() {
    this.core.store.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.core.deselectAllObjects();
    this.core.selectAllObjectsInViewport();
  }

  @Method()
  async clearSelection() {
    this.core.clearSelection();
  }

  @Method()
  async centerObjectInViewport(object: KritzelBaseObject) {
    object.centerInViewport();

    this.core.updateObject(object, object);
    this.core.rerender();

    return object;
  }

  @Method()
  async backToContent(): Promise<boolean> {
    return this.viewport.centerFitNearestContent(20);
  }

  @Method()
  async getCopiedObjects(): Promise<KritzelBaseObject[]> {
    return this.core.store.state.copiedObjects || [];
  }

  @Method()
  async getScreenshot(format: 'png' | 'svg' = 'png'): Promise<string> {
    if (!this.host) return null;

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

    if (format === 'svg') {
      return await toSvg(this.host, options);
    } else {
      return await toPng(this.host, options);
    }
  }

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

  @Method()
  async createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null> {
    await this.core.createWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
    return workspace;
  }

  @Method()
  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    await this.core.updateWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
  }

  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    await this.core.deleteWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
  }

  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return await this.core.getWorkspaces();
  }

  @Method()
  async getActiveWorkspace(): Promise<KritzelWorkspace> {
    return this.core.store.state.activeWorkspace;
  }

  core: KritzelCore;
  viewport: KritzelViewport;
  contextMenuHandler: KritzelContextMenuHandler;
  keyHandler: KritzelKeyHandler;
  contextMenuElement: HTMLKritzelContextMenuElement | null = null;

  private _lastHadSelectionGroup: boolean = false;


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
    this.core.cursorManager.cleanup();
  }

  componentWillLoad() {
    this.validateScaleMax(this.scaleMax);
    this.validateScaleMin(this.scaleMin);
    this.core.store.state.lockDrawingScale = this.lockDrawingScale;
  }

  async componentDidLoad() {
    this.contextMenuHandler = new KritzelContextMenuHandler(this.core, this.globalContextMenuItems, this.objectContextMenuItems);
    this.keyHandler = new KritzelKeyHandler(this.core);
    this.viewport = new KritzelViewport(this.core, this.host);

    // Initialize cursor manager with target element and shadow root
    this.core.cursorManager.setTargetElement(this.cursorTarget || document.body);
    this.core.cursorManager.setShadowRoot(this.host.shadowRoot);

    // Set sync configuration if provided
    if (this.syncConfig) {
      this.core.setSyncConfig(this.syncConfig);
    }

    // Initialize Yjs document and persistence layer
    await this.core.initializeYjs();

    // Initialize workspace (will load from Yjs if available)
    await this.core.initializeWorkspace(this.workspace);

    // Register callback for remote workspace changes
    this.core.appStateMap.onRemoteChange(() => {
      this.workspacesChange.emit(this.core.store.state.workspaces);
    });

    this._registerStateChangeListeners();

    if (this.core.store.state.isReady === false) {
      this.core.store.state.isReady = true;
      this.isEngineReady.emit(this.core.store.state);
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

  private _registerStateChangeListeners() {
    this.core.store.onStateChange('activeTool', this._handleActiveToolChange.bind(this));
  }

  private _handleActiveToolChange(activeTool: KritzelBaseTool) {
    if (!(activeTool instanceof KritzelSelectionTool)) {
      this.core.clearSelection();
      this.core.store.state.objects.remove(o => o instanceof KritzelSelectionBox);
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
    const computedStyle = window.getComputedStyle(this.host);
    const baseHandleSizePx = computedStyle.getPropertyValue('--kritzel-selection-handle-size').trim() || '6px';
    const baseHandleSize = parseFloat(baseHandleSizePx);
    const baseHandleTouchSize = baseHandleSize * 2 < 14 ? 14 : baseHandleSize;
    const viewportCenterX = this.core.store.state.viewportWidth / 2 + this.core.store.state.translateX;
    const viewportCenterY = this.core.store.state.viewportHeight / 2 + this.core.store.state.translateY;
    const viewportBounds = {
      x: -this.core.store.state.translateX / this.core.store.state.scale,
      y: -this.core.store.state.translateY / this.core.store.state.scale,
      z: this.core.store.state.scale,
      width: this.core.store.state.viewportWidth / this.core.store.state.scale,
      height: this.core.store.state.viewportHeight / this.core.store.state.scale,
      depth: 100,
    };
    const visibleObjects = this.core.store.state.objects.query(viewportBounds).sort((a, b) => a.zIndex - b.zIndex);

    this.core.cursorManager.applyCursor();

    if(this.core.store.totalObjectCount > 0){
      this.objectsInViewportChange.emit(visibleObjects);
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
                style={{
                  transform: object?.transformationMatrix,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  pointerEvents: this.core.store.state.isScaling ? 'none' : 'auto',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id={object.id}
                  class="object"
                  style={{
                    zIndex: object.zIndex.toString(),
                    height: object?.totalHeight + 'px',
                    width: object?.totalWidth + 'px',
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: object.rotationDegrees !== 0 ? `rotate(${object.rotationDegrees}deg)` : undefined,
                    transformOrigin: object.rotationDegrees !== 0 ? `${object.totalWidth / 2}px ${object.totalHeight / 2}px` : undefined,
                    opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                    pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                  }}
                >
                  {KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath') && (
                    <svg
                      ref={el => object.mount(el)}
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ overflow: 'visible' }}
                      viewBox={object?.viewBox}
                    >
                      <path d={object?.d} fill={object.fill} stroke={object?.stroke} shape-rendering={object.isLowRes() ? 'optimizeSpeed' : 'auto'} />
                    </svg>
                  )}

                  {KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') && (
                    <svg
                      ref={el => object.mount(el)}
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ overflow: 'visible' }}
                      viewBox={object?.viewBox}
                    >
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
                            <path
                              d={object.getArrowPath(object.arrows?.end?.style)}
                              fill={object.getArrowFill('end')}
                              transform={`scale(${object.getArrowSize('end') / 10})`}
                            />
                          </marker>
                        )}
                      </defs>
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
                        stroke={object?.stroke} 
                        stroke-width={object?.strokeWidth} 
                        stroke-linecap="round"
                        marker-start={object.hasStartArrow ? `url(#${object.startMarkerId})` : undefined}
                        marker-end={object.hasEndArrow ? `url(#${object.endMarkerId})` : undefined}
                      />
                    </svg>
                  )}

                  <foreignObject
                    x="0"
                    y="0"
                    width={object.totalWidth.toString()}
                    height={object.totalHeight.toString()}
                    style={{
                      minHeight: '0',
                      minWidth: '0',
                      backgroundColor: object.backgroundColor,
                      borderColor: object.borderColor,
                      borderWidth: object.borderWidth + 'px',
                      borderStyle: 'solid',
                      padding: object.padding + 'px',
                      overflow: 'visible',
                      display: KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') || KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath')  ? 'none' : 'block'
                    }}
                  >
                    {KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage') && (
                      <img
                        ref={el => object.mount(el)}
                        src={object.src}
                        style={{
                          width: '100%',
                          height: '100%',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          imageRendering: this.core.store.state.isScaling || this.core.store.state.isPanning ? 'pixelated' : 'auto',
                        }}
                        draggable={false}
                        onDragStart={e => e.preventDefault()}
                      />
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText') && (
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
                          backgroundColor: object.backgroundColor,
                          overflow: 'visible',
                          textRendering: this.core.store.state.isScaling || this.core.store.state.isPanning ? 'optimizeSpeed' : 'auto',
                        }}
                      ></div>
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelShape>(object, 'KritzelShape') && (
                      <div
                        ref={el => object.mount(el)}
                        onPointerDown={e => object.handlePointerDown(e)}
                        onPointerMove={e => object.handlePointerMove(e)}
                        onPointerUp={e => object.handlePointerUp(e)}
                        style={{
                          width: '100%',
                          height: '100%',
                          position: 'relative',
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
                            fill={object.fillColor}
                            stroke={object.strokeColor}
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

                    {KritzelClassHelper.isInstanceOf<KritzelCustomElement>(object, 'KritzelCustomElement') && (
                      <div
                        ref={el => object.mount(el)}
                        style={{
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'auto',
                          overflow: 'hidden',
                          display: 'block',
                        }}
                      ></div>
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') && !this.core.displaySelectionLineUI(object) && (
                      <div
                        ref={el => object.mount(el)}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      ></div>
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelSelectionBox>(object, 'KritzelSelectionBox') && (
                      <div
                        ref={el => object.mount(el)}
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: KritzelDevicesHelper.isFirefox() ? object.backgroundColor : 'transparent',
                          borderWidth: KritzelDevicesHelper.isFirefox() ? object.borderWidth + 'px' : '0',
                          borderStyle: KritzelDevicesHelper.isFirefox() ? 'solid' : 'none',
                          borderColor: KritzelDevicesHelper.isFirefox() ? object.borderColor : 'transparent',
                        }}
                      ></div>
                    )}
                  </foreignObject>

                </svg>
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
                          <circle
                            class="resize-handle top-left"
                            cx="0"
                            cy="0"
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="resize-handle-overlay top-left"
                            cx="0"
                            cy="0"
                            r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'transparent',
                              paintOrder: 'fill',
                            }}
                          />

                          <circle
                            class="resize-handle top-right"
                            cx={object.totalWidth}
                            cy="0"
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="resize-handle-overlay top-right"
                            cx={object.totalWidth}
                            cy="0"
                            r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'transparent',
                              paintOrder: 'fill',
                            }}
                          />

                          <circle
                            class="resize-handle bottom-left"
                            cx="0"
                            cy={object.totalHeight}
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="resize-handle-overlay bottom-left"
                            cx="0"
                            cy={object.totalHeight}
                            r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'transparent',
                              paintOrder: 'fill',
                            }}
                          />

                          <circle
                            class="resize-handle bottom-right"
                            cx={object.totalWidth}
                            cy={object.totalHeight}
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="resize-handle-overlay bottom-right"
                            cx={object.totalWidth}
                            cy={object.totalHeight}
                            r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
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
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
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
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="selection-line-handle-overlay start"
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
                            cx={object.controlX !== undefined ? (object.startX + 2 * object.controlX + object.endX) / 4 - object.x : (object.startX - object.x + object.endX - object.x) / 2}
                            cy={object.controlY !== undefined ? (object.startY + 2 * object.controlY + object.endY) / 4 - object.y : (object.startY - object.y + object.endY - object.y) / 2}
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="selection-line-handle-overlay center"
                            cx={object.controlX !== undefined ? (object.startX + 2 * object.controlX + object.endX) / 4 - object.x : (object.startX - object.x + object.endX - object.x) / 2}
                            cy={object.controlY !== undefined ? (object.startY + 2 * object.controlY + object.endY) / 4 - object.y : (object.startY - object.y + object.endY - object.y) / 2}
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
                            r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                            style={{
                              fill: 'var(--kritzel-selection-handle-color, #000000)',
                              paintOrder: 'fill',
                            }}
                          />
                          <circle
                            class="selection-line-handle-overlay end"
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
                    data.edgeX !== undefined && data.edgeY !== undefined && (
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
