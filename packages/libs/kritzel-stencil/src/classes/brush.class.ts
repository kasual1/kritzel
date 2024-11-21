import { ClickHelper } from '../helpers/click.helper';
import { Tool } from '../interfaces/tool.interface';
import state from '../stores/kritzel-engine.store';
import { Path } from './path.class';

export class Brush implements Tool {
  name: string = 'brush';
  icon: string = 'brush';

  isDrawing: boolean = false;

  currentPath: Path | undefined;

  constructor() {
    state.activeTool = this;
  }

  handleMouseDown(event: MouseEvent) {
    if (ClickHelper.isLeftClick(event)) {
      this.isDrawing = true;
      const x = event.clientX;
      const y = event.clientY;

      state.currentPath = new Path({
        points: [[x, y]],
        translateX: -state.translateX,
        translateY: -state.translateY,
        scale: state.scale,
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      const x = event.clientX;
      const y = event.clientY;

      state.currentPath = new Path({
        points: [...state.currentPath.points, [x, y]],
        translateX: -state.translateX,
        translateY: -state.translateY,
        scale: state.scale,
      });
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isDrawing) {
      this.isDrawing = false;

      if (state.currentPath) {
        state.paths.push(state.currentPath);
      }

      state.currentPath = undefined;
    }
  }

  handleWheel(_event: WheelEvent): void {
    //TODO: Update paths's scaling factor
    throw new Error('Method not implemented.');
  }
}
