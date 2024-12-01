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
    this.state.objects.forEach(object => {
      object.selected = false;
    });

    this.state.objects = [...this.state.objects];
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
          </div>
        )}

        <div
          class="origin"
          style={{
            transform: `matrix(${this.viewport.state.scale}, 0, 0, ${this.viewport.state.scale}, ${this.viewport.state.translateX}, ${this.viewport.state.translateY})`,
          }}
        >
          {this.state.objects?.map(object => {
            if (object instanceof KritzelPath) {
              const path = object as KritzelPath;

              return (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id={path.id}
                  class="object"
                  style={{
                    height: path?.height.toString(),
                    width: path?.width.toString(),
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: path?.transformationMatrix,
                    opacity: path.markedForRemoval ? '0.5' : '1',
                  }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2={path.width}
                    y2="0"
                    style={{ stroke: path.selection.stroke.color, strokeWidth: `${(path.selection.stroke.size * path.scale) / this.viewport.state.scale}` }}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={path.height}
                    style={{ stroke: path.selection.stroke.color, strokeWidth: `${(path.selection.stroke.size * path.scale) / this.viewport.state.scale}` }}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1={path.height}
                    x2={path.width}
                    y2={path.height}
                    style={{ stroke: path.selection.stroke.color, strokeWidth: `${(path.selection.stroke.size * path.scale) / this.viewport.state.scale}` }}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1={path.width}
                    y1="0"
                    x2={path.width}
                    y2={path.height}
                    style={{ stroke: path.selection.stroke.color, strokeWidth: `${(path.selection.stroke.size * path.scale) / this.viewport.state.scale}` }}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="selection-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(path.selection.handles.size * path.scale) / this.viewport.state.scale}`}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle top-right"
                    cx={path.width}
                    cy="0"
                    r={`${(path.selection.handles.size * path.scale) / this.viewport.state.scale}`}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-left"
                    cx="0"
                    cy={path.height}
                    r={`${(path.selection.handles.size * path.scale) / this.viewport.state.scale}`}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-right"
                    cx={path.width}
                    cy={path.height}
                    r={`${(path.selection.handles.size * path.scale) / this.viewport.state.scale}`}
                    visibility={path.selected ? 'visible' : 'hidden'}
                  />

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: path?.height.toString(),
                      width: path?.width.toString(),
                      position: 'relative',
                    }}
                    viewBox={path?.viewBox}
                  >
                    <path d={path?.d} fill={path?.fill} stroke={path?.stroke} />
                  </svg>
                </svg>
              );
            }

            if (object instanceof KritzelImage) {
              const image = object as KritzelImage;

              return (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id={image.id}
                  class="object"
                  style={{
                    height: image?.height.toString(),
                    width: image?.width.toString(),
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: image?.transformationMatrix,
                    opacity: image.markedForRemoval ? '0.5' : '1',
                  }}
                >
                  <image
                    href={image.img.src}
                    height={image.height.toString()}
                    width={image.width.toString()}
                    style={{
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />

                  <line
                    x1="0"
                    y1="0"
                    x2={image.width}
                    y2="0"
                    style={{ stroke: image.selection.stroke.color, strokeWidth: `${(image.selection.stroke.size * image.scale) / this.viewport.state.scale}` }}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={image.height}
                    style={{ stroke: image.selection.stroke.color, strokeWidth: `${(image.selection.stroke.size * image.scale) / this.viewport.state.scale}` }}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1={image.height}
                    x2={image.width}
                    y2={image.height}
                    style={{ stroke: image.selection.stroke.color, strokeWidth: `${(image.selection.stroke.size * image.scale) / this.viewport.state.scale}` }}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1={image.width}
                    y1="0"
                    x2={image.width}
                    y2={image.height}
                    style={{ stroke: image.selection.stroke.color, strokeWidth: `${(image.selection.stroke.size * image.scale) / this.viewport.state.scale}` }}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="selection-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(image.selection.handles.size * image.scale) / this.viewport.state.scale}`}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle top-right"
                    cx={image.width}
                    cy="0"
                    r={`${(image.selection.handles.size * image.scale) / this.viewport.state.scale}`}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-left"
                    cx="0"
                    cy={image.height}
                    r={`${(image.selection.handles.size * image.scale) / this.viewport.state.scale}`}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-right"
                    cx={image.width}
                    cy={image.height}
                    r={`${(image.selection.handles.size * image.scale) / this.viewport.state.scale}`}
                    visibility={image.selected ? 'visible' : 'hidden'}
                  />
                </svg>
              );
            }

            if (object instanceof KrtizelText) {
              const text = object as KrtizelText;

              return (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id={text.id}
                  class="object"
                  style={{
                    height: text?.height.toString(),
                    width: text?.width.toString(),
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: text?.transformationMatrix,
                    opacity: text.markedForRemoval ? '0.5' : '1',
                  }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2={text.width}
                    y2="0"
                    style={{ stroke: text.selection.stroke.color, strokeWidth: `${(text.selection.stroke.size * text.scale) / this.viewport.state.scale}` }}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={text.height}
                    style={{ stroke: text.selection.stroke.color, strokeWidth: `${(text.selection.stroke.size * text.scale) / this.viewport.state.scale}` }}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1="0"
                    y1={text.height}
                    x2={text.width}
                    y2={text.height}
                    style={{ stroke: text.selection.stroke.color, strokeWidth: `${(text.selection.stroke.size * text.scale) / this.viewport.state.scale}` }}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />
                  <line
                    x1={text.width}
                    y1="0"
                    x2={text.width}
                    y2={text.height}
                    style={{ stroke: text.selection.stroke.color, strokeWidth: `${(text.selection.stroke.size * text.scale) / this.viewport.state.scale}` }}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />

                  <circle
                    class="selection-handle top-left"
                    cx="0"
                    cy="0"
                    r={`${(text.selection.handles.size * text.scale) / this.viewport.state.scale}`}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle top-right"
                    cx={text.width}
                    cy="0"
                    r={`${(text.selection.handles.size * text.scale) / this.viewport.state.scale}`}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-left"
                    cx="0"
                    cy={text.height}
                    r={`${(text.selection.handles.size * text.scale) / this.viewport.state.scale}`}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />
                  <circle
                    class="selection-handle bottom-right"
                    cx={text.width}
                    cy={text.height}
                    r={`${(text.selection.handles.size * text.scale) / this.viewport.state.scale}`}
                    visibility={text.selected ? 'visible' : 'hidden'}
                  />

                  <foreignObject
                    x="0"
                    y="0"
                    width={text.width.toString()}
                    height={text.height.toString()}
                  >
                    <textarea
                      ref={el => (text.elementRef = el)}
                      value={text.value}
                      onInput={event => text.handleInput(event)}
                      rows={1}
                      style={{
                        width: text.width?.toString() + 'px',
                        height: text.height?.toString() + 'px',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                      }}
                    ></textarea>
                  </foreignObject>
                </svg>
              );
            }
          })}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{
              height: this.state.currentPath?.height.toString(),
              width: this.state.currentPath?.width.toString(),
              left: '0',
              top: '0',
              zIndex: '-1',
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
