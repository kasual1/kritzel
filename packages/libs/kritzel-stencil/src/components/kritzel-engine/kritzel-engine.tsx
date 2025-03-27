import { Component, Host, h, Listen, Element, Prop } from '@stencil/core';
import { KritzelTool } from '../../interfaces/tool.interface';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelViewport } from '../../classes/viewport.class';
import { KritzelPath } from '../../classes/objects/path.class';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelImageTool } from '../../classes/tools/image-tool.class';
import { KritzelImage } from '../../classes/objects/image.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KrtizelText } from '../../classes/objects/text.class';
import { KritzelSelectionGroup } from '../../classes/objects/selection-group.class';
import { KrtizelSelectionBox } from '../../classes/objects/selection-box.class';
import { KritzelStore } from '../../stores/store';

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

  store: KritzelStore;

  viewport: KritzelViewport;

  get isSelecting() {
    return this.store.state.activeTool instanceof KritzelSelectionTool && this.store.state.isSelecting;
  }

  get isSelectionActive() {
    return this.store.state.activeTool instanceof KritzelSelectionTool && this.store.state.selectionGroup !== null;
  }

  constructor() {
    this.store = new KritzelStore();
    this.viewport = new KritzelViewport(this.store, this.host);
    this.store.state.activeTool = new KritzelBrushTool(this.store);
  }

  @Listen('contextmenu', { target: 'window' })
  handleContextMenu(ev) {
    ev.preventDefault();
  }

  @Listen('mousedown', { target: 'window', passive: true })
  handleMouseDown(ev) {
    this.viewport.handleMouseDown(ev);
    this.store.state?.activeTool?.handleMouseDown(ev);
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev) {
    this.viewport.handleMouseMove(ev);
    this.store.state?.activeTool?.handleMouseMove(ev);
  }

  @Listen('mouseup', { target: 'window', passive: true })
  handleMouseUp(ev) {
    this.viewport.handleMouseUp(ev);
    this.store.state?.activeTool?.handleMouseUp(ev);
  }

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(ev) {
    this.viewport.handleWheel(ev);
    this.store.state?.activeTool?.handleWheel(ev);
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev) {
    if (ev.ctrlKey) {
      ev.preventDefault();

      if (ev.key === 'z') {
        this.store.undo();
      }

      if (ev.key === 'y') {
        this.store.redo();
      }

      if (ev.key === 'd') {
        this.store.state.showDebugInfo = !this.store.state.showDebugInfo;
      }

      if (ev.key === 's') {
        this.store.state.activeTool = new KritzelSelectionTool(this.store);
        this.store.deselectAllObjects();
      }

      if (ev.key === 'b') {
        this.store.state.activeTool = new KritzelBrushTool(this.store);
        this.store.deselectAllObjects();
      }

      if (ev.key === 'e') {
        this.store.state.activeTool = new KritzelEraserTool(this.store);
        this.store.deselectAllObjects();
      }

      if (ev.key === 'i') {
        this.store.state.activeTool = new KritzelImageTool(this.store);
        this.store.deselectAllObjects();
      }

      if (ev.key === 'x') {
        this.store.state.activeTool = new KritzelTextTool(this.store);
        this.store.deselectAllObjects();
      }
    }
  }

  render() {
    return (
      <Host>
        {this.store.state.showDebugInfo && (
          <div class="debug-panel">
            <div>StartX: {this.store.state?.startX}</div>
            <div>StartY: {this.store.state?.startY}</div>
            <div>TranslateX: {this.store.state?.translateX}</div>
            <div>TranslateY: {this.store.state?.translateY}</div>
            <div>Scale: {this.store.state?.scale}</div>
            <div>ActiveTool: {this.store.state?.activeTool?.name}</div>
            <div>HasViewportChanged: {this.store.state?.hasViewportChanged ? 'true': 'false'}</div>
            <div>IsSelecting: {this.isSelecting ? 'true': 'false'}</div>
            <div>IsSelectionActive: {this.isSelectionActive ? 'true': 'false'}</div>
            <div>IsResizeHandleSelected: {this.store.state.isResizeHandleSelected ? 'true': 'false'}</div>
            <div>IsRotationHandleSelected: {this.store.state.isRotationHandleSelected ? 'true': 'false'}</div>
            <div>CursorX: {this.store.state?.cursorX}</div>
            <div>CursorY: {this.store.state?.cursorY}</div>
          </div>
        )}

        <div
          class="origin"
          style={{
            transform: `matrix(${this.store.state?.scale}, 0, 0, ${this.store.state?.scale}, ${this.store.state?.translateX}, ${this.store.state?.translateY})`,
          }}
        >
          {this.store.state.objects?.map(object => {
            return (
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
                  transform: object?.transformationMatrix,
                  opacity: object.markedForRemoval ? '0.5' : object.opacity.toString(),
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
                    style={{ minHeight: '0', minWidth: '0', backgroundColor: object.backgroundColor, padding: object.padding + 'px' }}
                  >
                    {object instanceof KritzelPath && (
                      <svg
                        ref={el => object.mount(el)}
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          height: object?.height.toString(),
                          width: object?.width.toString(),
                          position: 'relative',
                        }}
                        viewBox={object?.viewBox}
                      >
                        <path d={object?.d} fill={object?.fill} stroke={object?.stroke} />
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

                    {object instanceof KrtizelText && (
                      <textarea
                        ref={el => object.mount(el)}
                        value={object.value}
                        onInput={event => object.handleInput(event)}
                        rows={object.rows}
                        readOnly={object.isReadonly}
                        style={{
                          width: '100%',
                          height: '100%',
                          fontSize: object.fontSize?.toString() + 'px',
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          overflow: 'hidden',
                          display: 'block',
                          whiteSpace: object.isReadonly ? 'pre-wrap' : 'nowrap',
                          cursor: object.isReadonly ? 'default' : 'text',
                        }}
                      ></textarea>
                    )}

                    {object instanceof KritzelSelectionGroup && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      >
                      </div>
                    )}

                    {object instanceof KrtizelSelectionBox && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      >
                      </div>
                    )}
                  </foreignObject>

                  <line
                    x1="0"
                    y1="0"
                    x2={object.totalWidth}
                    y2="0"
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.store.state?.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={object.totalHeight}
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.store.state?.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1={object.totalHeight}
                    x2={object.totalWidth}
                    y2={object.totalHeight}
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.store.state?.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1={object.totalWidth}
                    y1="0"
                    x2={object.totalWidth}
                    y2={object.totalHeight}
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.store.state?.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="selection-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(object.selection.handles.size * object.scale) / this.store.state?.scale}`}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}

                  />
                  <circle
                    class="selection-handle top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(object.selection.handles.size * object.scale) / this.store.state?.scale}`}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(object.selection.handles.size * object.scale) / this.store.state?.scale}`}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(object.selection.handles.size * object.scale) / this.store.state?.scale}`}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />

                  <line
                    x1={object.totalWidth / 2}
                    y1="0"
                    x2={object.totalWidth / 2}
                    y2="-20"
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.store.state?.scale}` }}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle"
                    cx={object.totalWidth / 2}
                    cy="-20"
                    r={`${(object.selection.handles.size * object.scale) / this.store.state?.scale}`}
                    visibility={object.selected && !this.isSelecting ? 'visible' : 'hidden'}
                  />
                </g>

                <g style={{display: this.store.state.showDebugInfo ? 'block' : 'none'}}>
                  <foreignObject
                    x={object.totalWidth.toString()}
                    y="0"
                    width="400px"
                    height="110px"
                    style={{ minHeight: '0', minWidth: '0', display: object.debugInfoVisible ? 'block' : 'none'}}
                  >

                    <div style={{ width: '100%', height: '100%'}}>
                      <div style={{ whiteSpace: 'nowrap'}}>translateX: {object.translateX}</div>
                      <div style={{ whiteSpace: 'nowrap'}}>translateY: {object.translateY}</div>
                      <div style={{ whiteSpace: 'nowrap'}}>width: {object.width}</div>
                      <div style={{ whiteSpace: 'nowrap'}}>height: {object.height}</div>
                      <div style={{ whiteSpace: 'nowrap'}}>scale: {object.scale}</div>
                      <div style={{ whiteSpace: 'nowrap'}}>rotation: {object.rotation}</div>
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
            }}
            viewBox={this.store.state.currentPath?.viewBox}
          >
            <path d={this.store.state.currentPath?.d} fill={this.store.state.currentPath?.fill} stroke={this.store.state.currentPath?.stroke} />
          </svg>
        </div>
      </Host>
    );
  }
}
