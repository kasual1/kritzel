import { Component, Host, h, Listen, Element, Prop } from '@stencil/core';
import state from '../../stores/kritzel-engine.store';
import { Tool } from '../../interfaces/tool.interface';
import { Brush } from '../../classes/brush.class';
import { Viewport } from '../../classes/viewport.class';
import { History } from '../../classes/history.class';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Element()
  host: HTMLElement;

  @Prop()
  activeTool: Tool;

  viewport: Viewport;

  history: History;

  componentWillLoad() {
    this.activeTool = new Brush();
    this.viewport = new Viewport(this.host, state);
    this.history = new History(state);
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
    this.history.handleMouseUp(ev, state);
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
        {state.showDebugPanel && (
          <div class="debug-panel">
            <div>StartX: {state.startX}</div>
            <div>StartY: {state.startY}</div>
            <div>TranslateX: {state.translateX}</div>
            <div>TranslateY: {state.translateY}</div>
          </div>
        )}

        <div
          class="origin"
          style={{
            transform: `matrix(${state.scale}, 0, 0, ${state.scale}, ${state.translateX}, ${state.translateY})`,
          }}
        >
          {state.paths?.map(path => (
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
              height: state.currentPath?.height.toString(),
              width: state.currentPath?.width.toString(),
              left: '0',
              top: '0',
              position: 'absolute',
              transform: state.currentPath?.transformationMatrix,
            }}
            viewBox={state.currentPath?.viewBox}
          >
            <path d={state.currentPath?.d} fill={state.currentPath?.fill} stroke={state.currentPath?.stroke} />
          </svg>
        </div>
      </Host>
    );
  }
}
