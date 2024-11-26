import { Component, Host, h, Listen, Element, Prop } from '@stencil/core';
import { KritzelTool } from '../../interfaces/tool.interface';
import { KritzelBrushTool } from '../../classes/brush-tool.class';
import { KritzelViewport } from '../../classes/viewport.class';
import { KritzelHistory } from '../../classes/history.class';
import { KritzelEngineState, kritzelEngineState } from '../../stores/engine.store';
import { KritzelPath } from '../../classes/path.class';
import { KritzelSelectionTool } from '../../classes/selection-tool.class';
import { KritzelEraserTool } from '../../classes/eraser-tool.class';
import { KritzelImageTool } from '../../classes/image-tool.class';
import { KrtizelText } from '../../classes/text.class';
import { KritzelImage } from '../../classes/image.class';
import { KritzelTextTool } from '../../classes/text-tool.class';

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
      }

      if (ev.key === 'b') {
        this.state.activeTool = new KritzelBrushTool();
      }

      if (ev.key === 'e') {
        this.state.activeTool = new KritzelEraserTool();
      }

      if (ev.key === 'i') {
        this.state.activeTool = new KritzelImageTool();
      }

      if (ev.key === 'x') {
        this.state.activeTool = new KritzelTextTool();
      }
    }
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
            <div>SelectedObjects: {this.state.selectedObjects.length}</div>
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
                <div
                  id={path.id}
                  class="object"
                  style={{
                    height: path?.height.toString(),
                    width: path?.width.toString(),
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: path?.transformationMatrix,
                    border: path.selected ? '2px dashed blue' : '2px solid transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: path?.height.toString(),
                      width: path?.width.toString(),
                      position: 'relative',
                      opacity: path.markedForRemoval ? '0.5' : '1',
                    }}
                    viewBox={path?.viewBox}
                  >
                    <path d={path?.d} fill={path?.fill} stroke={path?.stroke} />
                  </svg>
                </div>
              );
            }

            if (object instanceof KritzelImage) {
              const image = object as KritzelImage;

              return (
                <div
                  id={image.id}
                  class="object"
                  style={{
                    height: image?.height.toString(),
                    width: image?.width.toString(),
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: image?.transformationMatrix,
                    border: image.selected ? '2px dashed blue' : '2px solid transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  <img
                    src={image.img.src}
                    style={{
                      height: image.height.toString(),
                      width: image.height.toString(),
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              );
            }

            if (object instanceof KrtizelText) {
              const text = object as KrtizelText;

              return (
                <div
                  id={text.id}
                  class="object"
                  style={{
                    height: text?.height?.toString() + 'px',
                    width: text?.width?.toString() + 'px',
                    left: '0',
                    top: '0',
                    position: 'absolute',
                    transform: text?.transformationMatrix,
                    border: text.selected ? '2px dashed blue' : '2px solid transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  <textarea
                    ref={el => (text.elementRef = el)}
                    value={text.value}
                    onInput={event => text.handleInput(event)}
                    rows={1}
                    style={{
                      width: text.width?.toString() + 'px',
                      height: text.height?.toString() + 'px',
                    }}
                  ></textarea>
                </div>
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
              border: '2px solid transparent',
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
