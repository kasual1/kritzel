import { Component, Host, h, Listen, Element, Prop } from '@stencil/core';
import { KritzelTool } from '../../interfaces/tool.interface';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelViewport } from '../../classes/viewport.class';
import { KritzelHistory } from '../../classes/history.class';
import { KritzelEngineState, kritzelEngineState } from '../../stores/engine.store';
import { KritzelPath } from '../../classes/objects/path.class';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelImageTool } from '../../classes/tools/image-tool.class';
import { KritzelImage } from '../../classes/objects/image.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KrtizelText } from '../../classes/objects/text.class';
import { KrtizelSelectionGroup } from '../../classes/objects/selection-group.class';
import { KrtizelSelectionBox } from '../../classes/objects/selection-box.class';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element()
  host: HTMLElement;

  @Prop()
  activeTool: KritzelTool = new KritzelBrushTool();

  viewport: KritzelViewport;

  history: KritzelHistory;

  state: KritzelEngineState = kritzelEngineState;

  componentWillLoad() {
    this.viewport = new KritzelViewport(this.host);
    this.state.activeTool = this.activeTool;
    this.history = new KritzelHistory();
  }

  @Listen('contextmenu', { target: 'window' })
  handleContextMenu(ev) {
    ev.preventDefault();
  }

  @Listen('mousedown', { target: 'window', passive: true })
  handleMouseDown(ev) {
    this.viewport?.handleMouseDown(ev);
    this.state.activeTool?.handleMouseDown(ev);
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev) {
    this.viewport?.handleMouseMove(ev);
    this.state.activeTool?.handleMouseMove(ev);
  }

  @Listen('mouseup', { target: 'window', passive: true })
  handleMouseUp(ev) {
    this.viewport?.handleMouseUp(ev);
    this.state.activeTool?.handleMouseUp(ev);
    this.history.handleMouseUp(ev);
  }

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(ev) {
    this.viewport?.handleWheel(ev);
    this.state.activeTool?.handleWheel(ev);
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev) {
    if (ev.ctrlKey) {
      ev.preventDefault();

      if (ev.key === 'z') {
        this.history.undo();
      }

      if (ev.key === 'y') {
        this.history.redo();
      }

      if (ev.key === 'd') {
        this.state.showDebugPanel = !this.state.showDebugPanel;
      }

      if (ev.key === 's') {
        this.state.activeTool = new KritzelSelectionTool();
        this.deselectAllObjects();
      }

      if (ev.key === 'b') {
        this.state.activeTool = new KritzelBrushTool();
        this.deselectAllObjects();
      }

      if (ev.key === 'e') {
        this.state.activeTool = new KritzelEraserTool();
        this.deselectAllObjects();
      }

      if (ev.key === 'i') {
        this.state.activeTool = new KritzelImageTool();
        this.deselectAllObjects();
      }

      if (ev.key === 'x') {
        this.state.activeTool = new KritzelTextTool();
        this.deselectAllObjects();
      }
    }
  }

  private deselectAllObjects() {
    const objects = this.state.objects.filter(o => !(o instanceof KrtizelSelectionBox)).filter(o => !(o instanceof KrtizelSelectionGroup));

    objects.forEach(object => {
      object.selected = false;
    });

    this.state.objects = [...objects];
  }

  render() {
    this.viewport.updateObjectsVisibility();

    return (
      <Host>
        {this.state.showDebugPanel && (
          <div class="debug-panel">
            <div>StartX: {this.viewport.state.startX}</div>
            <div>StartY: {this.viewport.state.startY}</div>
            <div>TranslateX: {this.viewport.state.translateX}</div>
            <div>TranslateY: {this.viewport.state.translateY}</div>
            <div>CurrentStateIndex: {this.history.currentStateIndex}</div>
            <div>Scale: {this.viewport.state.scale}</div>
            <div>ActiveTool: {this.state.activeTool.name}</div>
            <div>CursorX: {this.viewport.state.cursorX}</div>
            <div>CursorY: {this.viewport.state.cursorY}</div>
          </div>
        )}

        <div
          class="origin"
          style={{
            transform: `matrix(${this.viewport.state.scale}, 0, 0, ${this.viewport.state.scale}, ${this.viewport.state.translateX}, ${this.viewport.state.translateY})`,
          }}
        >
          {this.state.objects?.map(object => {
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

                    {object instanceof KrtizelSelectionGroup && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        This is an object selection
                      </div>
                    )}

                    {object instanceof KrtizelSelectionBox && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        This is selection box
                      </div>
                    )}
                  </foreignObject>

                  <line
                    x1="0"
                    y1="0"
                    x2={object.totalWidth}
                    y2="0"
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.viewport.state.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={object.totalHeight}
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.viewport.state.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1={object.totalHeight}
                    x2={object.totalWidth}
                    y2={object.totalHeight}
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.viewport.state.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1={object.totalWidth}
                    y1="0"
                    x2={object.totalWidth}
                    y2={object.totalHeight}
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.viewport.state.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="selection-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(object.selection.handles.size * object.scale) / this.viewport.state.scale}`}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle top-right"
                    cx={object.totalWidth}
                    cy="0"
                    r={`${(object.selection.handles.size * object.scale) / this.viewport.state.scale}`}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-left"
                    cx="0"
                    cy={object.totalHeight}
                    r={`${(object.selection.handles.size * object.scale) / this.viewport.state.scale}`}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-right"
                    cx={object.totalWidth}
                    cy={object.totalHeight}
                    r={`${(object.selection.handles.size * object.scale) / this.viewport.state.scale}`}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />

                  <line
                    x1={object.totalWidth / 2}
                    y1="0"
                    x2={object.totalWidth / 2}
                    y2="-20"
                    style={{ stroke: object.selection.stroke.color, strokeWidth: `${(object.selection.stroke.size * object.scale) / this.viewport.state.scale}` }}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="rotation-handle"
                    cx={object.totalWidth / 2}
                    cy="-20"
                    r={`${(object.selection.handles.size * object.scale) / this.viewport.state.scale}`}
                    visibility={object.selected ? 'visible' : 'hidden'}
                  />
                </g>

                <g>
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
              height: this.state.currentPath?.height.toString(),
              width: this.state.currentPath?.width.toString(),
              left: '0',
              top: '0',
              zIndex: this.state.currentPath?.zIndex.toString(),
              position: 'absolute',
              transform: this.state.currentPath?.transformationMatrix,
            }}
            viewBox={this.state.currentPath?.viewBox}
          >
            <path d={this.state.currentPath?.d} fill={this.state.currentPath?.fill} stroke={this.state.currentPath?.stroke} />
          </svg>
        </div>
      </Host>
    );
  }
}
