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
import { KritzelToolRegistry } from '../../../classes/tool.registry';
import { KritzelBrushToolConfig, KritzelTextToolConfig } from '../../../interfaces/toolbar-control.interface';
import { KritzelKeyboardHelper } from '../../../helpers/keyboard.helper';
import { KritzelContextMenuHandler } from '../../../classes/handlers/context-menu.handler';

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
    { label: 'Select All', icon: 'select-all', action: () => this.selectAllInViewport() },
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
        this.store.resetSelection();
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
  }

  @Listen('contextmenu', { capture: false })
  handleContextMenu(ev: MouseEvent) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.contextMenuHandler.handleContextMenu(ev);
  }

  @Listen('mousedown', { passive: true })
  handleMouseDown(ev: MouseEvent) {
    if (this.store.state.isContextMenuVisible) {
      this.store.state.isContextMenuVisible = false;
      this.store.state.isEnabled = true;
      return;
    }

    if (this.store.state.isEnabled === false) {
      return;
    }

    this.viewport.handleMouseDown(ev);
    this.store.state?.activeTool?.handleMouseDown(ev);
  }

  @Listen('mousemove', { passive: true })
  handleMouseMove(ev) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.viewport.handleMouseMove(ev);
    this.store.state?.activeTool?.handleMouseMove(ev);
  }

  @Listen('mouseup', { passive: true })
  handleMouseUp(ev) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.viewport.handleMouseUp(ev);
    this.store.state?.activeTool?.handleMouseUp(ev);
  }

  @Listen('dblclick')
  handleDoubleClick(ev: MouseEvent) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.store.state?.activeTool?.handleDoubleClick(ev);
  }

  @Listen('touchstart', { passive: false })
  handleTouchStart(ev: TouchEvent) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    this.store.state.longTouchTimeout = setTimeout(() => this.contextMenuHandler.handleContextMenu(ev), this.store.state.longTouchDelay);
    
    ev.preventDefault();
    this.viewport.handleTouchStart(ev);
    this.store.state?.activeTool?.handleTouchStart(ev);
  }

  @Listen('touchmove', { passive: false })
  handleTouchMove(ev) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    ev.preventDefault();
    this.viewport.handleTouchMove(ev);
    this.store.state?.activeTool?.handleTouchMove(ev);
  }

  @Listen('touchend', { passive: false })
  handleTouchEnd(ev) {
    if (this.store.state.isEnabled === false) {
      return;
    }

    clearTimeout(this.store.state.longTouchTimeout);

    ev.preventDefault();
    this.viewport.handleTouchEnd(ev);
    this.store.state?.activeTool?.handleTouchEnd(ev);
  }

  @Listen('touchcancel', { passive: false })
  handleTouchCancel(_ev) {
    clearTimeout(this.store.state.longTouchTimeout);
  }

  @Listen('wheel', { passive: false })
  handleWheel(ev) {
    if (this.store.state.isContextMenuVisible) {
      this.store.state.isContextMenuVisible = false;
      this.store.state.isEnabled = true;
    }

    this.viewport.handleWheel(ev);
    this.store.state?.activeTool?.handleWheel(ev);
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
    this.store.state.isContextMenuVisible = false;
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
  async moveToTop() {
    this.store.moveToTop();
  }

  @Method()
  async moveToBottom() {
    this.store.moveToBottom();
  }

  @Method()
  async selectAllInViewport() {
    this.store.selectAllInViewport();
  }

  @Method()
  async undo() {
    this.store.history.undo();
  }

  @Method()
  async redo() {
    this.store.history.redo();
  }

  render() {
    const computedStyle = window.getComputedStyle(this.host);
    const baseHandleSizePx = computedStyle.getPropertyValue('--kritzel-selection-handle-size').trim() || '6px';
    const baseHandleSize = parseFloat(baseHandleSizePx);

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
                  transform: object?.transformationMatrix,
                  opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
                  pointerEvents: object.markedForRemoval ? 'none' : 'auto',
                  zIndex: object.zIndex.toString(),
                }}
              >
                <g
                  transform={`rotate(${object.rotationDegrees})`}
                  style={{
                    transformOrigin: 'center',
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
                    {object instanceof KritzelPath && (
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

                    {object instanceof KritzelImage && (
                      <img
                        ref={el => object.mount(el)}
                        src={object.img.src}
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

                    {object instanceof KritzelText && (
                      <textarea
                        ref={el => object.mount(el)}
                        value={object.value}
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
                          whiteSpace: 'nowrap',
                          cursor: object.isReadonly ? 'default' : 'text',
                          caretColor: object.isReadonly ? 'transparent' : 'auto',
                        }}
                      ></textarea>
                    )}

                    {object instanceof KritzelSelectionGroup && (
                      <div
                        ref={el => object.mount(el)}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      ></div>
                    )}

                    {object instanceof KrtizelSelectionBox && (
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
                      stroke: 'var(--kritzel-selection-border-color)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 1) * ${object.scale} / ${this.store.state?.scale})`,
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
                      stroke: 'var(--kritzel-selection-border-color)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 1) * ${object.scale} / ${this.store.state?.scale})`,
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
                      stroke: 'var(--kritzel-selection-border-color)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 1) * ${object.scale} / ${this.store.state?.scale})`,
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
                      stroke: 'var(--kritzel-selection-border-color)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 1) * ${object.scale} / ${this.store.state?.scale})`,
                      strokeLinecap: 'square',
                    }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="selection-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <line
                    x1={object.totalWidth / 2}
                    y1="0"
                    x2={object.totalWidth / 2}
                    y2={-((15 * object.scale) / this.store.state?.scale)}
                    style={{
                      stroke: 'var(--kritzel-selection-border-color)',
                      strokeWidth: `calc(var(--kritzel-selection-border-width, 1) * ${object.scale} / ${this.store.state?.scale})`,
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle"
                    cx={object.totalWidth / 2}
                    cy={-((15 * object.scale) / this.store.state?.scale)}
                    r={`${(baseHandleSize * object.scale) / this.store.state?.scale}`}
                    style={{
                      fill: 'var(--kritzel-selection-handle-color)',
                    }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                </g>

                <g style={{ display: this.store.state.debugInfo.showObjectInfo ? 'block' : 'none' }}>
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
              overflow: 'visible',
            }}
            viewBox={this.store.state.currentPath?.viewBox}
          >
            <path d={this.store.state.currentPath?.d} fill={this.store.state.currentPath?.fill} stroke={this.store.state.currentPath?.stroke} />
          </svg>
        </div>

        {this.store.state.isContextMenuVisible && (
          <kritzel-context-menu
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

        {this.store.state?.activeTool instanceof KritzelEraserTool && !this.store.state.isScaling && <kritzel-cursor-trail></kritzel-cursor-trail>}
      </Host>
    );
  }
}
