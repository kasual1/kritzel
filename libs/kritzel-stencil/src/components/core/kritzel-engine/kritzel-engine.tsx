import { Component, Host, h, Listen, Element, Prop, Method, State, Event, EventEmitter, Watch } from '@stencil/core';
import { KritzelTool } from '../../../interfaces/tool.interface';
import { KritzelViewport } from '../../../classes/viewport.class';
import { KritzelPath } from '../../../classes/objects/path.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelImage } from '../../../classes/objects/image.class';
import { KritzelText } from '../../../classes/objects/text.class';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
import { KrtizelSelectionBox } from '../../../classes/objects/selection-box.class';
import { KritzelKeyHandler } from '../../../classes/handlers/key.handler';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelBrushToolConfig, KritzelTextToolConfig } from '../../../interfaces/toolbar-control.interface';
import { KritzelKeyboardHelper } from '../../../helpers/keyboard.helper';
import { KritzelContextMenuHandler } from '../../../classes/handlers/context-menu.handler';
import { AddObjectCommand } from '../../../classes/commands/add-object.command';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { UpdateObjectCommand } from '../../../classes/commands/update-object.command';
import { RemoveObjectCommand } from '../../../classes/commands/remove-object.command';
import { KritzelToolRegistry } from '../../../classes/registries/tool.registry';
import { KritzelEventHelper } from '../../../helpers/event.helper';
import { KritzelClassHelper } from '../../../helpers/class.helper';
import { ABSOLUTE_SCALE_MAX, ABSOLUTE_SCALE_MIN } from '../../../constants/engine.constants';
import { KritzelCustomElement } from '../../../classes/objects/custom-element.class';
import { KritzelWorkspace } from '../../../classes/workspace.class';
import { KritzelEngineState } from '../../../interfaces/engine-state.interface';
import { KritzelCore } from '../../../classes/core/core.class';

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
    if (newWorkspace) {
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
      this.core.state.scaleMax = this.scaleMax;
    } else {
      this.core.state.scaleMax = newValue;
    }
  }
  @Prop({ mutable: true }) scaleMin: number = ABSOLUTE_SCALE_MIN;
  @Watch('scaleMin')
  validateScaleMin(newValue: number) {
    if (newValue < ABSOLUTE_SCALE_MIN) {
      console.warn(`scaleMin cannot be less than ${ABSOLUTE_SCALE_MIN}.`);
      this.scaleMin = ABSOLUTE_SCALE_MIN;
      this.core.state.scaleMin = this.scaleMin;
    } else {
      this.core.state.scaleMin = newValue;
    }
  }

  @Event() isEngineReady: EventEmitter<KritzelEngineState>;
  @Event() activeToolChange: EventEmitter<KritzelBaseTool>;
  @Event() workspacesChange: EventEmitter<KritzelWorkspace[]>;

  @State() forceUpdate: number = 0;

  @Listen('wheel', { passive: false })
  handleWheel(ev) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (this.core.state.isContextMenuVisible) {
      this.hideContextMenu();
    }

    this.viewport.handleWheel(ev);
    this.core.state?.activeTool?.handleWheel(ev);
  }

  @Listen('pointerdown', { passive: false })
  handlePointerDown(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    if (KritzelEventHelper.isPointerEventOnContextMenu(ev) === false && this.core.state.isContextMenuVisible) {
      this.hideContextMenu();
      return;
    }

    KritzelEventHelper.onLongTouchPress(ev, (event: PointerEvent) => {
      if (!(this.core.state.activeTool instanceof KritzelSelectionTool)) {
        return;
      }
      this.contextMenuHandler.handleContextMenu(event);
    });

    this.host.setPointerCapture(ev.pointerId);
    this.core.state.pointers.set(ev.pointerId, ev);

    this.viewport.handlePointerDown(ev);
    this.core.state?.activeTool?.handlePointerDown(ev);
  }

  @Listen('pointermove', { passive: false })
  handlePointerMove(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.core.state.pointers.set(ev.pointerId, ev);

    this.viewport.handlePointerMove(ev);
    this.core.state?.activeTool?.handlePointerMove(ev);
  }

  @Listen('pointerup', { passive: false })
  handlePointerUp(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.core.state.pointers.delete(ev.pointerId);
    this.host.releasePointerCapture(ev.pointerId);

    this.viewport.handlePointerUp(ev);
    this.core.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('pointercancel', { passive: false })
  handlePointerCancel(ev: PointerEvent) {
    if (this.core.store.isDisabled) {
      return;
    }

    this.host.releasePointerCapture(ev.pointerId);
    this.core.state.pointers.delete(ev.pointerId);

    this.viewport.handlePointerUp(ev);
    this.core.state?.activeTool?.handlePointerUp(ev);
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
    this.keyHandler.handleKeyDown(ev);
  }

  @Listen('keyup', { target: 'window' })
  handleKeyUp(ev) {
    this.keyHandler.handleKeyUp(ev);
  }

  @Listen('mousedown', { target: 'window', passive: true })
  updateFocus(ev) {
    if (this.core.store.isDisabled) {
      return;
    }

    const rect = this.core.state.host.getBoundingClientRect();
    const isInside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;

    const path = ev.composedPath();
    const kritzelEngineElement = this.host.closest('kritzel-engine');
    const isInKritzelEngine = path.includes(kritzelEngineElement || this.host);

    this.core.store.setState('isFocused', isInside && isInKritzelEngine);
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
    this.core.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', tool);
    this.core.deselectAllObjects();
    tool?.onActivate();
  }

  @Method()
  async setFocus() {
    this.host.focus();
    this.core.state.isFocused = true;
  }

  @Method()
  async disable() {
    this.core.state.isEnabled = false;
    this.forceUpdate++;
  }

  @Method()
  async enable() {
    this.core.state.isEnabled = true;
    this.forceUpdate++;
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
    this.core.history.undo();
  }

  @Method()
  async redo() {
    this.core.history.redo();
  }

  @Method()
  async hideContextMenu() {
    this.core.state.pointers.clear();
    this.core.state.isContextMenuVisible = false;
    this.core.state.selectionBox = null;
    this.core.state.isSelecting = false;
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
    object.scale = object.scale ? object.scale : this.core.state.scale;
    object.zIndex = this.core.store.currentZIndex;

    const command = new AddObjectCommand(this.core, this, object);
    this.core.history.executeCommand(command);

    return object;
  }

  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    this.core.deselectAllObjects();

    const command = new UpdateObjectCommand(this.core, this, object, updatedProperties);
    this.core.history.executeCommand(command);

    return object;
  }

  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.core.deselectAllObjects();

    const command = new RemoveObjectCommand(this.core, this, object);
    this.core.history.executeCommand(command);

    return object;
  }

  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject<any>[]> {
    return this.core.state.selectionGroup ? this.core.state.selectionGroup.objects : [];
  }

  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    this.core.state.activeTool?.onDeactivate();
    this.core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.core.deselectAllObjects();
    this.core.selectObjects(objects);
  }

  @Method()
  async selectAllObjectsInViewport() {
    this.core.state.activeTool?.onDeactivate();
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

    const command = new UpdateObjectCommand(this.core, this, object, object);
    this.core.history.executeCommand(command);

    return object;
  }

  @Method()
  async getCopiedObjects(): Promise<KritzelBaseObject[]> {
    return this.core.state.copiedObjects?.objects || [];
  }

  @Method()
  async createWorkspace(workspace: KritzelWorkspace) {
    return this.core.createWorkspace(workspace).then(() => {
      this.workspacesChange.emit(this.core.state.workspaces);
    });
  }

  @Method()
  async updateWorkspace(workspace: KritzelWorkspace) {
    return this.core.updateWorkspace(workspace).then(() => {
      this.workspacesChange.emit(this.core.state.workspaces);
    });
  }

  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace) {
    return this.core.deleteWorkspace(workspace).then(async () => {
      this.workspacesChange.emit(this.core.state.workspaces);
    });
  }

  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return this.core.getWorkspaces();
  }

  core: KritzelCore;
  viewport: KritzelViewport;
  contextMenuHandler: KritzelContextMenuHandler;
  keyHandler: KritzelKeyHandler;
  contextMenuElement: HTMLKritzelContextMenuElement | null = null;

  get isSelecting() {
    return this.core.state.activeTool instanceof KritzelSelectionTool && this.core.state.isSelecting;
  }

  get isSelectionActive() {
    return this.core.state.activeTool instanceof KritzelSelectionTool && this.core.state.selectionGroup !== null;
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

    this._registerStateChangeListeners();

    await this.core.initializeDatabase();
    await this.core.initializeWorkspace(this.workspace);

    if (this.core.state.isReady === false) {
      this.core.state.isReady = true;
      this.isEngineReady.emit(this.core.state);
    }
  }

  private _registerStateChangeListeners() {
    this.core.store.onStateChange('activeTool', this._handleActiveToolChange.bind(this));
    this.core.store.onStateChange('isFocused', this._handleIsFocusedChange.bind(this));
  }

  private _handleActiveToolChange(activeTool: KritzelBaseTool) {
    if (!(activeTool instanceof KritzelSelectionTool)) {
      this.core.clearSelection();
    }

    this.core.state.skipContextMenu = false;
    this.activeToolChange.emit(activeTool);
    KritzelKeyboardHelper.forceHideKeyboard();
  }

  private _handleIsFocusedChange(isFocused: boolean) {
    if (!isFocused) {
      this.core.resetActiveText();
    }
  }

  render() {
    const computedStyle = window.getComputedStyle(this.host);
    const baseHandleSizePx = computedStyle.getPropertyValue('--kritzel-selection-handle-size').trim() || '6px';
    const baseHandleSize = parseFloat(baseHandleSizePx);
    const baseHandleTouchSize = baseHandleSize * 2 < 14 ? 14 : baseHandleSize;

    return (
      <Host>
        <div class="debug-panel" style={{ display: this.core.state.debugInfo.showViewportInfo ? 'block' : 'none' }}>
          <div>ActiveWorkspaceId: {this.core.state?.activeWorkspace?.id}</div>
          <div>ActiveWorkspaceName: {this.core.state?.activeWorkspace?.name}</div>
          <div>TranslateX: {this.core.state?.translateX}</div>
          <div>TranslateY: {this.core.state?.translateY}</div>
          <div>ViewportWidth: {this.core.state?.viewportWidth}</div>
          <div>ViewportHeight: {this.core.state?.viewportHeight}</div>
          <div>Scale: {this.core.state?.scale}</div>
          <div>ActiveTool: {this.core.state?.activeTool?.name}</div>
          <div>HasViewportChanged: {this.core.state?.hasViewportChanged ? 'true' : 'false'}</div>
          <div>IsEnabled: {this.core.state?.isEnabled ? 'true' : 'false'}</div>
          <div>IsScaling: {this.core.state?.isScaling ? 'true' : 'false'}</div>
          <div>IsPanning: {this.core.state?.isPanning ? 'true' : 'false'}</div>
          <div>IsFocused: {this.core.state.isFocused ? 'true' : 'false'}</div>
          <div>IsSelecting: {this.isSelecting ? 'true' : 'false'}</div>
          <div>IsSelectionActive: {this.isSelectionActive ? 'true' : 'false'}</div>
          <div>IsResizeHandleSelected: {this.core.state.isResizeHandleSelected ? 'true' : 'false'}</div>
          <div>IsRotationHandleSelected: {this.core.state.isRotationHandleSelected ? 'true' : 'false'}</div>
          <div>IsDrawing: {this.core.state.isDrawing ? 'true' : 'false'}</div>
          <div>IsWriting: {this.core.state.isWriting ? 'true' : 'false'}</div>
          <div>PointerX: {this.core.state?.pointerX}</div>
          <div>PointerY: {this.core.state?.pointerY}</div>
          <div>SelectedObjects: {this.core.state.selectionGroup?.objects.length || 0}</div>
        </div>

        <div
          id="origin"
          class="origin"
          style={{
            transform: `matrix(${this.core.state?.scale}, 0, 0, ${this.core.state?.scale}, ${this.core.state?.translateX}, ${this.core.state?.translateY})`,
          }}
        >
          {this.core.state.objectsMap.allObjects()?.map(object => {
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
                    transformOrigin: 'center',
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
                        ref={el => (el ? object.mount(el) : object.unmount())}
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
                        ref={el => (el ? object.mount(el) : object.unmount())}
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
                      <textarea
                        ref={el => (el ? object.mount(el) : object.unmount())}
                        value={object.value}
                        onKeyDown={event => object.handleKeyDown(event)}
                        onInput={event => object.handleInput(event)}
                        rows={object.rows}
                        style={{
                          width: '100%',
                          height: '100%',
                          color: object.fontColor,
                          fontSize: object.fontSize?.toString() + 'px',
                          fontFamily: object.fontFamily,
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          overflow: 'hidden',
                          display: 'block',
                          padding: '1px',
                          whiteSpace: 'nowrap',
                          pointerEvents: object.isReadonly ? 'none' : 'auto',
                          cursor: object.isReadonly ? 'default' : 'text',
                          caretColor: object.isReadonly ? 'transparent' : 'auto',
                        }}
                      ></textarea>
                    )}

                    {KritzelClassHelper.isInstanceOf<KritzelCustomElement>(object, 'KritzelCustomElement') && (
                      <div
                        ref={el => (el ? object.mount(el) : object.unmount())}
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
                        ref={el => (el ? object.mount(el) : object.unmount())}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      ></div>
                    )}

                    {KritzelClassHelper.isInstanceOf<KrtizelSelectionBox>(object, 'KrtizelSelectionBox') && (
                      <div
                        ref={el => (el ? object.mount(el) : object.unmount())}
                        style={{
                          width: '100%',
                          height: '100%',
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
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.state?.scale})`,
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
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.state?.scale})`,
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
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.state?.scale})`,
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
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.state?.scale})`,
                      strokeLinecap: 'square',
                    }}
                    visibility={object.isSelected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleTouchSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleTouchSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleTouchSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleTouchSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <line
                    x1={object.totalWidth / 2}
                    y1="0"
                    x2={object.totalWidth / 2}
                    y2={-((15 * object.scale) / this.core.state?.scale)}
                    style={{
                      stroke: 'var(--kritzel-selection-border-color, #007AFF)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.core.state?.scale})`,
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.core.state?.scale)}
                    r={`${(baseHandleSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle-overlay"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.core.state?.scale)}
                    r={`${(baseHandleTouchSize * object.scale) / this.core.state?.scale}`}
                    style={{
                      fill: 'transparent',
                      cursor: 'grab',
                    }}
                    visibility={object.isSelected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <g style={{ display: this.core.state.debugInfo.showObjectInfo ? 'block' : 'none', pointerEvents: 'none' }}>
                    <foreignObject
                      x={object.totalWidth.toString()}
                      y="0"
                      width="400px"
                      height="160px"
                      style={{ minHeight: '0', minWidth: '0', display: object.isDebugInfoVisible ? 'block' : 'none' }}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>zIndex: {object.zIndex}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>translateX: {object.translateX}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>translateY: {object.translateY}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>width: {object.width}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>height: {object.height}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>scale: {object.scale}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>rotation: {object.rotation}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>x: {object.x}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>y: {object.y}</div>
                      </div>
                    </foreignObject>
                  </g>
                </svg>
              </div>
            );
          })}

          <svg
            class="object"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              height: this.core.state.currentPath?.height.toString(),
              width: this.core.state.currentPath?.width.toString(),
              left: '0',
              top: '0',
              zIndex: this.core.state.currentPath?.zIndex.toString(),
              position: 'absolute',
              transform: this.core.state.currentPath?.transformationMatrix,
              transformOrigin: 'top left',
              overflow: 'visible',
            }}
            viewBox={this.core.state.currentPath?.viewBox}
          >
            <path d={this.core.state.currentPath?.d} fill={this.core.state.currentPath?.fill} stroke={this.core.state.currentPath?.stroke} />
          </svg>
        </div>

        {this.core.state.isContextMenuVisible && (
          <kritzel-context-menu
            class="context-menu"
            ref={el => (this.contextMenuElement = el)}
            items={this.core.state.contextMenuItems}
            objects={this.core.state.selectionGroup?.objects || []}
            style={{
              position: 'fixed',
              left: `${this.core.state.contextMenuX}px`,
              top: `${this.core.state.contextMenuY}px`,
              zIndex: '10000',
            }}
            onActionSelected={event => {
              event.detail.action(
                {
                  x: (-this.core.state.translateX + this.core.state.contextMenuX) / this.core.state.scale,
                  y: (-this.core.state.translateY + this.core.state.contextMenuY) / this.core.state.scale,
                },
                this.core.state.selectionGroup?.objects,
              );
              this.hideContextMenu();
            }}
          ></kritzel-context-menu>
        )}

        {this.core.state?.activeTool instanceof KritzelEraserTool && !this.core.state.isScaling && <kritzel-cursor-trail core={this.core}></kritzel-cursor-trail>}
      </Host>
    );
  }
}
