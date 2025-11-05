import { Component, Host, h, Listen, Element, Prop, Method, State, Event, EventEmitter, Watch } from '@stencil/core';
import { KritzelTool } from '../../../interfaces/tool.interface';
import { KritzelViewport } from '../../../classes/core/viewport.class';
import { KritzelPath } from '../../../classes/objects/path.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelImage } from '../../../classes/objects/image.class';
import { KritzelText } from '../../../classes/objects/text.class';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
import { KritzelSelectionBox } from '../../../classes/objects/selection-box.class';
import { KritzelKeyHandler } from '../../../classes/handlers/key.handler';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelBrushToolConfig, KritzelTextToolConfig } from '../../../interfaces/toolbar-control.interface';
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

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element() host: HTMLElement;

  @Prop() workspace?: KritzelWorkspace;
  @Watch('workspace')
  onWorkspaceChange(newWorkspace: KritzelWorkspace | null) {
    if (this.core.store.state.activeWorkspace !== newWorkspace) {
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

  @Event() isEngineReady: EventEmitter<KritzelEngineState>;
  @Event() activeToolChange: EventEmitter<KritzelBaseTool>;
  @Event() workspacesChange: EventEmitter<KritzelWorkspace[]>;
  @Event() longpress: EventEmitter<PointerEvent>;

  @State() forceUpdate: number = 0;

  @Listen('wheel', { passive: false })
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

  @Listen('pointermove', { passive: false })
  handlePointerMove(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.core.store.state.pointers.set(ev.pointerId, ev);

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

    this.viewport.handlePointerUp(ev);
    this.core.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('longpress', { passive: false })
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
  async registerTool(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig): Promise<KritzelBaseTool> {
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
    this.core.store.state.objectsMap.remove(o => o instanceof KritzelSelectionBox);
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

    this.core.removeObject(object);
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
  async getCopiedObjects(): Promise<KritzelBaseObject[]> {
    return this.core.store.state.copiedObjects?.objects || [];
  }

  @Method()
  async createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null> {
    this.core.createWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
    return workspace;
  }

  @Method()
  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    this.core.updateWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
  }

  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    this.core.deleteWorkspace(workspace);
    this.workspacesChange.emit(this.core.store.state.workspaces);
  }

  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return this.core.getWorkspaces();
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

  get isSelecting() {
    return this.core.store.state.activeTool instanceof KritzelSelectionTool && this.core.store.state.isSelecting;
  }

  get isSelectionActive() {
    return this.core.store.state.activeTool instanceof KritzelSelectionTool && this.core.store.selectionGroup !== null;
  }

  constructor() {
    this.core = new KritzelCore(this);
  }

  componentWillLoad() {
    this.validateScaleMax(this.scaleMax);
    this.validateScaleMin(this.scaleMin);
  }

  async componentDidLoad() {
    this.contextMenuHandler = new KritzelContextMenuHandler(this.core, this.globalContextMenuItems, this.objectContextMenuItems);
    this.keyHandler = new KritzelKeyHandler(this.core);
    this.viewport = new KritzelViewport(this.core, this.host);

    // Initialize Yjs document and persistence layer
    await this.core.initializeYjs();
    
    // Initialize workspace (will load from Yjs if available)
    await this.core.initializeWorkspace(this.workspace);

    this._registerStateChangeListeners();

    if (this.core.store.state.isReady === false) {
      this.core.store.state.isReady = true;
      this.isEngineReady.emit(this.core.store.state);
    }
  }

  private _registerStateChangeListeners() {
    this.core.store.onStateChange('activeTool', this._handleActiveToolChange.bind(this));
  }

  private _handleActiveToolChange(activeTool: KritzelBaseTool) {
    if (!(activeTool instanceof KritzelSelectionTool)) {
      this.core.clearSelection();
      this.core.store.state.objectsMap.remove(o => o instanceof KritzelSelectionBox);
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

    return (
      <Host>
        <div class="debug-panel" style={{ display: this.core.store.state.debugInfo.showViewportInfo ? 'block' : 'none' }}>
          <div>ActiveWorkspaceId: {this.core.store.state?.activeWorkspace?.id}</div>
          <div>ActiveWorkspaceName: {this.core.store.state?.activeWorkspace?.name}</div>
          <div>TranslateX: {this.core.store.state?.translateX}</div>
          <div>TranslateY: {this.core.store.state?.translateY}</div>
          <div>ViewportWidth: {this.core.store.state?.viewportWidth}</div>
          <div>ViewportHeight: {this.core.store.state?.viewportHeight}</div>
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
          <div>IsDrawing: {this.core.store.state.isDrawing ? 'true' : 'false'}</div>
          <div>IsWriting: {this.core.store.state.isWriting ? 'true' : 'false'}</div>
          <div>PointerX: {this.core.store.state?.pointerX}</div>
          <div>PointerY: {this.core.store.state?.pointerY}</div>
          <div>SelectedObjects: {this.core.store.selectionGroup?.objects.length || 0}</div>
          <div>
            ViewportCenter: ({viewportCenterX.toFixed(2)}, {viewportCenterY.toFixed(2)})
          </div>
        </div>

        <div
          id="origin"
          class="origin"
          style={{
            transform: `matrix(${this.core.store.state?.scale}, 0, 0, ${this.core.store.state?.scale}, ${this.core.store.state?.translateX}, ${this.core.store.state?.translateY})`,
          }}
        >
          {this.core.store.state.objectsMap.allObjects()?.map(object => {
            return (
              <div
                key={object.id}
                style={{
                  display: object.isInViewport() ? 'block' : 'none',
                  transform: object?.transformationMatrix,
                  transformOrigin: 'top left',
                  zIndex: object.zIndex.toString(),
                  position: 'absolute',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id={object.id}
                  class="object"
                  style={{
                    height: object?.totalHeight.toString(),
                    width: object?.totalWidth.toString(),
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: `rotate(${object.rotationDegrees}deg)`,
                    transformOrigin: `${object.totalWidth / 2}px ${object.totalHeight / 2}px`,
                    opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                    pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                  }}
                >
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
                    }}
                  >
                    {KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath') && (
                      <svg
                        ref={el => object.mount(el)}
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          height: object?.height.toString(),
                          width: object?.width.toString(),
                          position: 'absolute',
                          overflow: 'visible',
                        }}
                        viewBox={object?.viewBox}
                      >
                        <path d={object?.d} fill={object.fill} stroke={object?.stroke} />
                      </svg>
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage') && (
                      <img
                        ref={el => object.mount(el)}
                        src={object.src}
                        style={{
                          width: '100%',
                          height: '100%',
                          userSelect: 'none',
                          pointerEvents: 'none',
                        }}
                        draggable={false}
                        onDragStart={e => e.preventDefault()}
                      />
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText') && (
                      <div
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
                        }}
                      ></div>
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

                    {KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') && (
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
                    visibility={object.isSelected ? 'visible' : 'hidden'}
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
                    visibility={object.isSelected ? 'visible' : 'hidden'}
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
                    visibility={object.isSelected ? 'visible' : 'hidden'}
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
                    visibility={object.isSelected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
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
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.core.store.state?.scale)}
                    r={`${(baseHandleSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle-overlay"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.core.store.state?.scale)}
                    r={`${(baseHandleTouchSize * object.scale) / this.core.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                      cursor: 'grab',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <g style={{ display: this.core.store.state.debugInfo.showObjectInfo ? 'block' : 'none', pointerEvents: 'none' }}>
                    <foreignObject
                      x={object.totalWidth.toString()}
                      y="0"
                      width="400px"
                      height="160px"
                      style={{ minHeight: '0', minWidth: '0', display: object.isDebugInfoVisible ? 'block' : 'none' }}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        <div style={{ whitespace: 'nowrap' }}>Id: {object.id}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>width: {object.width}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>height: {object.height}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>translateX: {object.translateX}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>translateY: {object.translateY}</div>
                        {/* <div style={{ whiteSpace: 'nowrap' }}>zIndex: {object.zIndex}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>scale: {object.scale}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>rotation: {object.rotation}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>x: {object.x}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>y: {object.y}</div> */}
                      </div>
                    </foreignObject>
                  </g>
                </svg>
              </div>
            );
          })}

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
              zIndex: '10000',
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
