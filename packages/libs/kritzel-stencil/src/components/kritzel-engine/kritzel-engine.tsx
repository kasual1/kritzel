import { Component, Host, h, Listen, State } from '@stencil/core';
import { EventButton } from './event-button.enum';
import { Path } from './path.class';
import { Drawing } from './drawing.interface';

@Component({
  tag: 'kritzel-engine',
  styleUrl: 'kritzel-engine.css',
  shadow: true,
})
export class KritzelEngine {

  @State()
  startX: number;

  @State()
  startY: number;

  @State()
  translateX: number = 0;

  @State()
  translateY: number = 0;

  @State()
  isDragging: boolean;

  @State()
  isDrawing: boolean;

  @State()
  currentPathPoints: number[][] = [];

  @State()
  currentPath?: Path;

  @State()
  scale: number = 1;

  @State()
  drawing: Drawing = {
    id: '1',
    releaseDate: new Date(),
    paths: [],
    translateX: 0,
    translateY: 0,
  }

  isRightClick = (ev) => ev.button === EventButton.RIGHT

  isLeftClick = (ev) => ev.button === EventButton.LEFT

  @Listen('mousedown', { target: 'window', passive: true })
  handleMouseDown(ev) {

    if(this.isRightClick(ev)) {
      this.isDragging = true;
      this.startX = ev.clientX;
      this.startY = ev.clientY;
    }

    if(this.isLeftClick(ev)) {
      this.isDrawing = true;
      const x = ev.clientX;
      const y = ev.clientY;

      this.currentPathPoints.push([x, y]);
      this.currentPath = new Path({
        points: this.currentPathPoints,
        translateX: -this.translateX,
        translateY: -this.translateY,
        scale: this.scale,
      });
    }
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev) {
    if (this.isDragging) {
      this.translateX -= this.startX - ev.clientX;
      this.translateY -= this.startY - ev.clientY;
      this.startX = ev.clientX;
      this.startY = ev.clientY;
    }

    if(this.isDrawing){
      const x = ev.clientX;
      const y = ev.clientY;
      this.currentPathPoints.push([x, y]);
      this.currentPath = new Path({
        points: this.currentPathPoints,
        translateX: -this.translateX,
        translateY: -this.translateY,
        scale: this.scale,
      });
    }
  }

  @Listen('mouseup', { target: 'window', passive: true })
  handleMouseUp(ev) {
    if (this.isDragging) {
      this.isDragging = false;
    }

    if (this.isDrawing) {
      this.isDrawing = false;

      if (this.currentPath) {
        this.drawing?.paths.push(this.currentPath);
      }

      this.currentPath = undefined;
      this.currentPathPoints = [];
    }
  }

  @Listen('wheel', { target: 'window', passive: true })
  handleWheel(ev) {
  }

  @Listen('contextmenu', { target: 'window' })
  handleContextMenu(ev) {
    ev.preventDefault();
  }


  private updateObjectsInViewport() {
    const padding = 25;

    this.drawing?.paths?.forEach((path) => {
      path.visible = path.isInViewport(
        {
          x: (-this.translateX - padding) / this.scale,
          y: (-this.translateY - padding) / this.scale,
          width: (window.innerWidth + 2 * padding) / this.scale,
          height: (window.innerHeight + 2 * padding) / this.scale,
        },
        this.scale
      );
    });
  }

  getOriginStyle = () => {
    return {
      transform: `matrix(${this.scale}, 0, 0, ${this.scale}, ${this.translateX}, ${this.translateY})`,
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
        <div class="debug-panel">
          <div>StartX: {this.startX}</div>
          <div>StartY: {this.startY}</div>
          <div>TranslateX: {this.translateX}</div>
          <div>TranslateY: {this.translateY}</div>
        </div>

        <div class="origin" style={this.getOriginStyle()}>
        
          {this.drawing?.paths?.map((path) => {
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
            style={this.getStyle(this.currentPath)}
            viewBox={this.currentPath?.viewBox}
          >
            <path
              d={this.currentPath?.d}
              fill={this.currentPath?.fill}
              stroke={this.currentPath?.stroke}
            />
          </svg>
        </div>
      </Host>
    );
  }
}
