import { Component, Host, h, Listen, Element } from '@stencil/core';
import { MouseButton } from '../../enums/event-button.enum';
import { Path } from '../../classes/path.class';
import state from '../../stores/kritzel-engine.store';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {

  @Element()
  host: HTMLElement;

  isRightClick = (ev) => ev.button === MouseButton.RIGHT

  isLeftClick = (ev) => ev.button === MouseButton.LEFT

  @Listen('mousedown', { target: 'window', passive: true })
  handleMouseDown(ev) {

    if(this.isRightClick(ev)) {
      state.isDragging = true;
      state.startX = ev.clientX;
      state.startY = ev.clientY;
    }

    if(this.isLeftClick(ev)) {
      state.isDrawing = true;
      const x = ev.clientX;
      const y = ev.clientY;

      state.currentPathPoints.push([x, y]);
      state.currentPath = new Path({
        points: state.currentPathPoints,
        translateX: -state.translateX,
        translateY: -state.translateY,
        scale: state.scale,
      });
    }
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev) {
    if (state.isDragging) {
      state.translateX -= state.startX - ev.clientX;
      state.translateY -= state.startY - ev.clientY;
      state.startX = ev.clientX;
      state.startY = ev.clientY;
    }

    if(state.isDrawing){
      const x = ev.clientX;
      const y = ev.clientY;
      state.currentPathPoints.push([x, y]);
      state.currentPath = new Path({
        points: state.currentPathPoints,
        translateX: -state.translateX,
        translateY: -state.translateY,
        scale: state.scale,
      });
    }
  }

  @Listen('mouseup', { target: 'window', passive: true })
  handleMouseUp() {
    if (state.isDragging) {
      state.isDragging = false;
    }

    if (state.isDrawing) {
      state.isDrawing = false;

      if (state.currentPath) {
        state.drawing?.paths.push(state.currentPath);
      }

      state.currentPath = undefined;
      state.currentPathPoints = [];
    }
  }

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(ev) {
    ev.preventDefault();

    const rect = this.host.getBoundingClientRect();
    state.cursorX = ev.clientX - rect.left;
    state.cursorY = ev.clientY - rect.top;

    const delta =
      ev.deltaY > 0
        ? -state.scaleStep * state.scale
        : state.scaleStep * state.scale;
    const newScale = this.getUpdatedScale(state.scale + delta);

    const scaleRatio = newScale / state.scale;
    const translateXAdjustment =
      (state.cursorX - state.translateX) * (scaleRatio - 1);
    const translateYAdjustment =
      (state.cursorY - state.translateY) * (scaleRatio - 1);

    state.scale = newScale;

    state.translateX -= translateXAdjustment;
    state.translateY -= translateYAdjustment;
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

    state.drawing?.paths?.forEach((path) => {
      path.visible = path.isInViewport(
        {
          x: (-state.translateX - padding) / state.scale,
          y: (-state.translateY - padding) / state.scale,
          width: (window.innerWidth + 2 * padding) / state.scale,
          height: (window.innerHeight + 2 * padding) / state.scale,
        },
        state.scale
      );
    });
  }

  getOriginStyle = () => {
    return {
      transform: `matrix(${state.scale}, 0, 0, ${state.scale}, ${state.translateX}, ${state.translateY})`,
    };
  }

  getStyle = (path: Path) => {
    return {
      height: path?.height.toString(),
      width: path?.width.toString(),
      left: '0',
      top: '0',
      position: 'absolute',
      transform: path?.transformationMatrix,
    };
  }

  render() {
    this.updateObjectsInViewport();

    return (
      <Host>

        {state.showDebugPanel &&
        <div class="debug-panel">
          <div>StartX: {state.startX}</div>
          <div>StartY: {state.startY}</div>
          <div>TranslateX: {state.translateX}</div>
          <div>TranslateY: {state.translateY}</div>
        </div>}

        <div class="origin" style={this.getOriginStyle()}>

          {state.drawing?.paths?.map((path) => {
            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={this.getStyle(path)}
                viewBox={path?.viewBox}
              >
                <path
                  d={path?.d}
                  fill={path?.fill}
                  stroke={path?.stroke}
                />
              </svg>
            );
          })}


          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={this.getStyle(state.currentPath)}
            viewBox={state.currentPath?.viewBox}
          >
            <path
              d={state.currentPath?.d}
              fill={state.currentPath?.fill}
              stroke={state.currentPath?.stroke}
            />
          </svg>
        </div>
      </Host>
    );
  }
}
