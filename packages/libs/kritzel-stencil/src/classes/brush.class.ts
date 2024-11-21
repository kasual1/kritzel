import { ClickHelper } from '../helpers/click.helper';
import { Tool } from '../interfaces/tool.interface';
import { KritzelEngineState } from '../stores/kritzel-engine.store';
import { Path } from './path.class';

export class Brush implements Tool {
  name: string = 'brush';
  icon: string = 'brush';
  state: KritzelEngineState;

  isDrawing: boolean = false;

  currentPath: Path | undefined;

  constructor(state: KritzelEngineState) {
    this.state = state;
  }

  handleMouseDown(event: MouseEvent) {
    if (ClickHelper.isLeftClick(event)) {
      this.isDrawing = true;
      const x = event.clientX;
      const y = event.clientY;

      this.state.currentPath = new Path({
        points: [[x, y]],
        translateX: -this.state.translateX,
        translateY: -this.state.translateY,
        scale: this.state.scale,
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      const x = event.clientX;
      const y = event.clientY;

      this.state.currentPath = new Path({
        points: [...this.state.currentPath.points, [x, y]],
        translateX: -this.state.translateX,
        translateY: -this.state.translateY,
        scale: this.state.scale,
      });
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isDrawing) {
      this.isDrawing = false;

      if (this.state.currentPath) {
        this.state.drawing?.paths.push(this.state.currentPath);
      }

      this.state.currentPath = undefined;
    }
  }

  handleWheel(_event: WheelEvent): void {
    //TODO: Update paths's scaling factor
    throw new Error('Method not implemented.');
  }
}
