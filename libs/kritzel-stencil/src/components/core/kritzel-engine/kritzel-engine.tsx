import { Component, Host, h, Listen, Element, Prop, Method, State, Event, EventEmitter } from '@stencil/core';
import { KritzelTool } from '../../../interfaces/tool.interface';
import { KritzelViewport } from '../../../classes/viewport.class';
import { KritzelPath } from '../../../classes/objects/path.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelImage } from '../../../classes/objects/image.class';
import { KritzelText } from '../../../classes/objects/text.class';
import { KritzelSelectionGroup } from '../../../classes/objects/selection-group.class';
import { KrtizelSelectionBox } from '../../../classes/objects/selection-box.class';
import { KritzelStore } from '../../../classes/store.class';
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

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element()
  host: HTMLElement;

  @Prop()
  activeTool: KritzelTool;

  @Prop()
  globalContextMenuItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      icon: 'paste',
      disabled: () => this.store.state.copiedObjects === null,
      action: () => {
        const x = (-this.store.state.translateX + this.store.state.contextMenuX) / this.store.state.scale;
        const y = (-this.store.state.translateY + this.store.state.contextMenuY) / this.store.state.scale;
        this.paste(x, y);
      },
    },
    { label: 'Select All', icon: 'select-all', action: () => this.selectAllObjectsInViewport() },
  ];

  @Prop()
  objectContextMenuItems: ContextMenuItem[] = [
    { label: 'Copy', icon: 'copy', action: () => this.copy() },
    {
      label: 'Paste',
      icon: 'paste',
      disabled: () => this.store.state.copiedObjects === null,
      action: () => {
        const x = (-this.store.state.translateX + this.store.state.contextMenuX) / this.store.state.scale;
        const y = (-this.store.state.translateY + this.store.state.contextMenuY) / this.store.state.scale;
        this.paste(x, y);
      },
    },
    { label: 'Delete', icon: 'delete', action: () => this.delete() },
    { label: 'Bring to Front', icon: 'bring-to-front', action: () => this.moveToTop() },
    { label: 'Send to Back', icon: 'send-to-back', action: () => this.moveToBottom() },
  ];

  @State()
  forceUpdate: number = 0;

  @Event()
  isEngineReady: EventEmitter<void>;

  @Event()
  activeToolChange: EventEmitter<KritzelBaseTool>;

  store: KritzelStore;

  viewport: KritzelViewport;

  contextMenuHandler: KritzelContextMenuHandler;

  keyHandler: KritzelKeyHandler;

  contextMenuElement: HTMLKritzelContextMenuElement | null = null;

  get isSelecting() {
    return this.store.state.activeTool instanceof KritzelSelectionTool && this.store.state.isSelecting;
  }

  get isSelectionActive() {
    return this.store.state.activeTool instanceof KritzelSelectionTool && this.store.state.selectionGroup !== null;
  }

  constructor() {
    this.store = new KritzelStore(this);
    this.contextMenuHandler = new KritzelContextMenuHandler(this.store, this.globalContextMenuItems, this.objectContextMenuItems);
    this.keyHandler = new KritzelKeyHandler(this.store);

    this.store.onStateChange('activeTool', (activeTool: KritzelBaseTool) => {
      if (!(activeTool instanceof KritzelSelectionTool)) {
        this.store.clearSelection();
      }

      this.store.state.skipContextMenu = false;
      this.activeToolChange.emit(activeTool);
      KritzelKeyboardHelper.forceHideKeyboard();
    });

    this.store.onStateChange('isFocused', (isFocused: boolean) => {
      if (!isFocused) {
        this.store.resetActiveText();
      }
    });
  }

  componentDidLoad() {
    this.viewport = new KritzelViewport(this.store, this.host);

    if (this.store.state.isReady === false) {
      this.store.state.isReady = true;
      this.isEngineReady.emit();
    }
  }

  @Listen('wheel', { passive: false })
  handleWheel(ev) {
    if (this.store.state.isContextMenuVisible) {
      this.hideContextMenu();
    }

    this.viewport.handleWheel(ev);
    this.store.state?.activeTool?.handleWheel(ev);
  }

  @Listen('pointerdown', { passive: false })
  handlePointerDown(ev: PointerEvent) {
    if (KritzelEventHelper.isPointerEventOnContextMenu(ev) === false && this.store.state.isContextMenuVisible) {
      this.hideContextMenu();
      return;
    }

    if (this.store.state.isEnabled === false) {
      return;
    }

    KritzelEventHelper.onLongTouchPress(ev, (event: PointerEvent) => {
      if (!(this.store.state.activeTool instanceof KritzelSelectionTool)) {
        return;
      }
      this.contextMenuHandler.handleContextMenu(event);
    });

    this.host.setPointerCapture(ev.pointerId);
    this.store.state.pointers.set(ev.pointerId, ev);

    this.viewport.handlePointerDown(ev);
    this.store.state?.activeTool?.handlePointerDown(ev);
  }

  @Listen('pointermove', { passive: false })
  handlePointerMove(ev: PointerEvent) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.store.state.pointers.set(ev.pointerId, ev);
    this.viewport.handlePointerMove(ev);
    this.store.state?.activeTool?.handlePointerMove(ev);
  }

  @Listen('pointerup', { passive: false })
  handlePointerUp(ev: PointerEvent) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.store.state.pointers.delete(ev.pointerId);
    this.host.releasePointerCapture(ev.pointerId);
    this.viewport.handlePointerUp(ev);
    this.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('pointercancel', { passive: false })
  handlePointerCancel(ev: PointerEvent) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.host.releasePointerCapture(ev.pointerId);
    this.store.state.pointers.delete(ev.pointerId);

    this.viewport.handlePointerUp(ev);
    this.store.state?.activeTool?.handlePointerUp(ev);
  }

  @Listen('contextmenu', { capture: false })
  handleContextMenu(ev: PointerEvent) {
    ev.preventDefault();

    if (this.store.state.isEnabled === false) {
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
    const rect = this.store.state.host.getBoundingClientRect();
    const isInside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;

    const path = ev.composedPath();
    const kritzelEngineElement = this.host.closest('kritzel-engine');
    const isInKritzelEngine = path.includes(kritzelEngineElement || this.host);

    this.store.setState('isFocused', isInside && isInKritzelEngine);
  }

  handleContextMenuAction(event: CustomEvent<ContextMenuItem>) {
    event.detail.action();
    this.hideContextMenu();
  }

  @Method()
  async registerTool(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig): Promise<KritzelBaseTool> {
    if (typeof toolClass !== 'function' || !(toolClass.prototype instanceof KritzelBaseTool)) {
      console.error(`Failed to register tool "${toolName}": Tool class must be a constructor function`);
      return null;
    }

    const registeredTool = KritzelToolRegistry.registerTool(toolName, toolClass, this.store);

    if (toolConfig) {
      Object.entries(toolConfig).forEach(([key, value]) => {
        registeredTool[key] = value;
      });
    }

    return Promise.resolve(registeredTool);
  }

  @Method()
  async changeActiveTool(tool: KritzelBaseTool) {
    this.store.state.activeTool?.onDeactivate();
    this.store.setState('activeTool', tool);
    this.store.deselectAllObjects();
    tool?.onActivate();
  }

  @Method()
  async setFocus() {
    this.host.focus();
    this.store.state.isFocused = true;
  }

  @Method()
  async disable() {
    this.store.state.isEnabled = false;
    this.forceUpdate++;
  }

  @Method()
  async enable() {
    this.store.state.isEnabled = true;
    this.forceUpdate++;
  }

  @Method()
  async delete() {
    this.store.delete();
  }

  @Method()
  async copy() {
    this.store.copy();
  }

  @Method()
  async paste(x: number, y: number) {
    this.store.paste(x, y);
  }

  @Method()
  async bringForward(object?: KritzelBaseObject<any>) {
    this.store.bringForward(object);
  }

  @Method()
  async sendBackward(object?: KritzelBaseObject<any>) {
    this.store.sendBackward(object);
  }

  @Method()
  async moveToTop(object?: KritzelBaseObject<any>) {
    this.store.bringToFront(object);
  }

  @Method()
  async moveToBottom(object?: KritzelBaseObject<any>) {
    this.store.sendToBack(object);
  }

  @Method()
  async undo() {
    this.store.history.undo();
  }

  @Method()
  async redo() {
    this.store.history.redo();
  }

  @Method()
  async hideContextMenu() {
    this.store.state.pointers.clear();
    this.store.state.isContextMenuVisible = false;
    this.store.state.selectionBox = null;
    this.store.state.isSelecting = false;
  }

  @Method()
  async getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null> {
    const object = this.store.objects.find(obj => obj.id === id) as T | undefined;
    return object || null;
  }

  @Method()
  async addObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.store.deselectAllObjects();

    object.id = object.generateId();
    object._store = this.store;
    object.scale = object.scale ? object.scale : this.store.state.scale;
    object.zIndex = this.store.currentZIndex;

    const command = new AddObjectCommand(this.store, this, object);
    this.store.history.executeCommand(command);

    return object;
  }

  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    this.store.deselectAllObjects();

    const command = new UpdateObjectCommand(this.store, this, object, updatedProperties);
    this.store.history.executeCommand(command);

    return object;
  }

  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    this.store.deselectAllObjects();

    const command = new RemoveObjectCommand(this.store, this, object);
    this.store.history.executeCommand(command);

    return object;
  }

  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject<any>[]> {
    return this.store.state.selectionGroup ? this.store.state.selectionGroup.objects : [];
  }

  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    this.store.state.activeTool?.onDeactivate();
    this.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.store.deselectAllObjects();
    this.store.selectObjects(objects);
    console.log('Selected objects:', objects);
  }

  @Method()
  async selectAllObjectsInViewport() {
    this.store.state.activeTool?.onDeactivate();
    this.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this.store.deselectAllObjects();
    this.store.selectAllObjectsInViewport();
  }

  @Method()
  async clearSelection() {
    this.store.clearSelection();
  }

  render() {
    const computedStyle = window.getComputedStyle(this.host);
    const baseHandleSizePx = computedStyle.getPropertyValue('--kritzel-selection-handle-size').trim() || '6px';
    const baseHandleSize = parseFloat(baseHandleSizePx);
    const baseHandleTouchSize = baseHandleSize * 2 < 14 ? 14 : baseHandleSize;

    return (
      <Host>
        <div class="debug-panel" style={{ display: this.store.state.debugInfo.showViewportInfo ? 'block' : 'none' }}>
          <div>TranslateX: {this.store.state?.translateX}</div>
          <div>TranslateY: {this.store.state?.translateY}</div>
          <div>ViewportWidth: {this.store.state?.viewportWidth}</div>
          <div>ViewportHeight: {this.store.state?.viewportHeight}</div>
          <div>ObjectsInViewport. {this.store.objects.length}</div>
          <div>Scale: {this.store.state?.scale}</div>
          <div>ActiveTool: {this.store.state?.activeTool?.name}</div>
          <div>HasViewportChanged: {this.store.state?.hasViewportChanged ? 'true' : 'false'}</div>
          <div>IsEnabled: {this.store.state?.isEnabled ? 'true' : 'false'}</div>
          <div>IsScaling: {this.store.state?.isScaling ? 'true' : 'false'}</div>
          <div>IsPanning: {this.store.state?.isPanning ? 'true' : 'false'}</div>
          <div>IsFocused: {this.store.state.isFocused ? 'true' : 'false'}</div>
          <div>IsSelecting: {this.isSelecting ? 'true' : 'false'}</div>
          <div>IsSelectionActive: {this.isSelectionActive ? 'true' : 'false'}</div>
          <div>IsResizeHandleSelected: {this.store.state.isResizeHandleSelected ? 'true' : 'false'}</div>
          <div>IsRotationHandleSelected: {this.store.state.isRotationHandleSelected ? 'true' : 'false'}</div>
          <div>IsDrawing: {this.store.state.isDrawing ? 'true' : 'false'}</div>
          <div>IsWriting: {this.store.state.isWriting ? 'true' : 'false'}</div>
          <div>CursorX: {this.store.state?.cursorX}</div>
          <div>CursorY: {this.store.state?.cursorY}</div>
        </div>

        <div
          class="origin"
          style={{
            transform: `matrix(${this.store.state?.scale}, 0, 0, ${this.store.state?.scale}, ${this.store.state?.translateX}, ${this.store.state?.translateY})`,
          }}
        >
          {this.store.objects?.map(object => {
            return (
              <div style={{ transform: object?.transformationMatrix, transformOrigin: 'top left', zIndex: object.zIndex.toString(), position: 'absolute' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  key={object.id}
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
                      <textarea
                        ref={el => object.mount(el)}
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

                    {KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup') && (
                      <div
                        ref={el => object.mount(el)}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      ></div>
                    )}

                    {KritzelClassHelper.isInstanceOf<KrtizelSelectionBox>(object, 'KrtizelSelectionBox') && (
                      <div
                        ref={el => object.mount(el)}
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
                      stroke: 'var(--kritzel-selection-border-color, #0e1111)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.store.state?.scale})`,
                      strokeLinecap: 'square',
                    }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={object.totalHeight}
                    style={{
                      stroke: 'var(--kritzel-selection-border-color, #0e1111)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.store.state?.scale})`,
                      strokeLinecap: 'square',
                    }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1={object.totalHeight}
                    x2={object.totalWidth}
                    y2={object.totalHeight}
                    style={{
                      stroke: 'var(--kritzel-selection-border-color, #0e1111)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.store.state?.scale})`,
                      strokeLinecap: 'square',
                    }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1={object.totalWidth}
                    y1="0"
                    x2={object.totalWidth}
                    y2={object.totalHeight}
                    style={{
                      stroke: 'var(--kritzel-selection-border-color, #0e1111)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.store.state?.scale})`,
                      strokeLinecap: 'square',
                    }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleTouchSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleTouchSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleTouchSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="resize-handle bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="resize-handle-overlay bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleTouchSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <line
                    x1={object.totalWidth / 2}
                    y1="0"
                    x2={object.totalWidth / 2}
                    y2={-((15 * object.scale) / this.store.state?.scale)}
                    style={{
                      stroke: 'var(--kritzel-selection-border-color, #0e1111)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 2px) * ${object.scale} / ${this.store.state?.scale})`,
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.store.state?.scale)}
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color, #000000)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle-overlay"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.store.state?.scale)}
                    r={`${(baseHandleTouchSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'transparent',
                      cursor: 'grab',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <g style={{ display: this.store.state.debugInfo.showObjectInfo ? 'block' : 'none', pointerEvents: 'none' }}>
                    <foreignObject
                      x={object.totalWidth.toString()}
                      y="0"
                      width="400px"
                      height="160px"
                      style={{ minHeight: '0', minWidth: '0', display: object.debugInfoVisible ? 'block' : 'none' }}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>zIndex: {object.zIndex}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>translateX: {object.translateX}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>translateY: {object.translateY}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>width: {object.width}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>height: {object.height}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>scale: {object.scale}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>rotation: {object.rotation}</div>
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
              height: this.store.state.currentPath?.height.toString(),
              width: this.store.state.currentPath?.width.toString(),
              left: '0',
              top: '0',
              zIndex: this.store.state.currentPath?.zIndex.toString(),
              position: 'absolute',
              transform: this.store.state.currentPath?.transformationMatrix,
              transformOrigin: 'top left',
              overflow: 'visible',
            }}
            viewBox={this.store.state.currentPath?.viewBox}
          >
            <path d={this.store.state.currentPath?.d} fill={this.store.state.currentPath?.fill} stroke={this.store.state.currentPath?.stroke} />
          </svg>
        </div>

        {this.store.state.isContextMenuVisible && (
          <kritzel-context-menu
            class="context-menu"
            ref={el => (this.contextMenuElement = el)}
            items={this.store.state.contextMenuItems}
            style={{
              position: 'fixed',
              left: `${this.store.state.contextMenuX}px`,
              top: `${this.store.state.contextMenuY}px`,
              zIndex: '10000',
            }}
            onActionSelected={event => this.handleContextMenuAction(event)}
          ></kritzel-context-menu>
        )}

        {this.store.state?.activeTool instanceof KritzelEraserTool && !this.store.state.isScaling && <kritzel-cursor-trail store={this.store}></kritzel-cursor-trail>}
      </Host>
    );
  }
}
