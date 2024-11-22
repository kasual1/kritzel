import { Component, Host, h, Listen, Element, Prop } from '@stencil/core';
import { KritzelTool } from '../../interfaces/tool.interface';
import { KritzelBrush } from '../../classes/brush.class';
import { KritzelViewport } from '../../classes/viewport.class';
import { KritzelHistory } from '../../classes/history.class';
import { KritzelEngineState, kritzelEngineState } from '../../stores/engine.store';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element()
  host: HTMLElement;

  @Prop()
  activeTool: KritzelTool = new KritzelBrush();

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
    this.viewport.handleMouseDown(ev);
    this.activeTool.handleMouseDown(ev);
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev) {
    this.viewport.handleMouseMove(ev);
    this.activeTool.handleMouseMove(ev);
  }

  @Listen('mouseup', { target: 'window', passive: true })
  handleMouseUp(ev) {
    this.viewport.handleMouseUp(ev);
    this.activeTool.handleMouseUp(ev);
    this.history.handleMouseUp(ev);
  }

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(ev) {
    this.viewport.handleWheel(ev);
    this.activeTool.handleWheel(ev);
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev) {
    if (ev.key === 'z' && ev.ctrlKey) {
      this.history.undo();
    }

    if (ev.key === 'y' && ev.ctrlKey) {
      this.history.redo();
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
          </div>
        )}

        <div
          class="origin"
          style={{
            transform: `matrix(${this.viewport.state.scale}, 0, 0, ${this.viewport.state.scale}, ${this.viewport.state.translateX}, ${this.viewport.state.translateY})`,
          }}
        >
          {this.state.paths?.map(path => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{
                height: path?.height.toString(),
                width: path?.width.toString(),
                left: '0',
                top: '0',
                position: 'absolute',
                transform: path?.transformationMatrix,
              }}
              viewBox={path?.viewBox}
            >
              <path d={path?.d} fill={path?.fill} stroke={path?.stroke} />
            </svg>
          ))}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{
              height: this.state.currentPath?.height.toString(),
              width: this.state.currentPath?.width.toString(),
              left: '0',
              top: '0',
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
