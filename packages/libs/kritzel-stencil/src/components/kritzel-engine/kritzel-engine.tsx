import { Component, Host, h, Listen, Element, Prop, Watch } from '@stencil/core';
import state from '../../stores/kritzel-engine.store';
import { Tool } from '../../interfaces/tool.interface';
import { ClickHelper } from '../../helpers/click.helper';
import { Brush } from '../../classes/brush.class';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {
  @Prop()
  activeTool: Tool = new Brush(state);

  @Element()
  host: HTMLElement;

  @Watch('activeTool')
  onActiveToolChange() {
    this.activeTool.state = state;
  }

  @Listen('mousedown', { target: 'window', passive: true })
  handleMouseDown(ev) {
    if (ClickHelper.isRightClick(ev)) {
      state.isDragging = true;
      state.startX = ev.clientX;
      state.startY = ev.clientY;
    }

    this.activeTool.handleMouseDown(ev);
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev) {
    if (state.isDragging) {
      state.translateX -= state.startX - ev.clientX;
      state.translateY -= state.startY - ev.clientY;
      state.startX = ev.clientX;
      state.startY = ev.clientY;
    }

    this.activeTool.handleMouseMove(ev);
  }

  @Listen('mouseup', { target: 'window', passive: true })
  handleMouseUp(ev) {
    if (state.isDragging) {
      state.isDragging = false;
    }

    this.activeTool.handleMouseUp(ev);
  }

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(ev) {
    ev.preventDefault();

    const rect = this.host.getBoundingClientRect();
    state.cursorX = ev.clientX - rect.left;
    state.cursorY = ev.clientY - rect.top;

    const delta = ev.deltaY > 0 ? -state.scaleStep * state.scale : state.scaleStep * state.scale;
    const newScale = this.getUpdatedScale(state.scale + delta);

    const scaleRatio = newScale / state.scale;
    const translateXAdjustment = (state.cursorX - state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (state.cursorY - state.translateY) * (scaleRatio - 1);

    state.scale = newScale;

    state.translateX -= translateXAdjustment;
    state.translateY -= translateYAdjustment;

    this.activeTool.handleWheel(ev);
  }

  @Listen('contextmenu', { target: 'window' })
  handleContextMenu(ev) {
    ev.preventDefault();
  }

  private getUpdatedScale(scale: number): number {
    return Math.min(state.scaleMax, Math.max(state.scaleMin, scale));
  }

  private updateObjectsInViewport() {
    const padding = 25;

    state.drawing?.paths?.forEach(path => {
      path.visible = path.isInViewport(
        {
          x: (-state.translateX - padding) / state.scale,
          y: (-state.translateY - padding) / state.scale,
          width: (window.innerWidth + 2 * padding) / state.scale,
          height: (window.innerHeight + 2 * padding) / state.scale,
        },
        state.scale,
      );
    });
  }
  render() {
    this.updateObjectsInViewport();

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
          {state.drawing?.paths?.map(path => (
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
