import { KritzelClickHelper } from '../helpers/click.helper';
import { KritzelTool } from '../interfaces/tool.interface';
import { kritzelEngineState, KritzelEngineState } from '../stores/engine.store';
import { kritzelViewportState, KritzelViewportState } from '../stores/viewport.store';
import { KritzelPath } from './path.class';

export class KritzelBrush implements KritzelTool {
  name: string = 'brush';
  icon: string = 'brush';

  viewportState: KritzelViewportState;
  engineState: KritzelEngineState;

  isDrawing: boolean;

  currentPath: KritzelPath | undefined;

  constructor() {
    this.isDrawing = false;
    this.viewportState = kritzelViewportState;
    this.engineState = kritzelEngineState;
  }

  handleMouseDown(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.isDrawing = true;
      const x = event.clientX;
      const y = event.clientY;

      this.engineState.currentPath = new KritzelPath({
        points: [[x, y]],
        translateX: -this.viewportState.translateX,
        translateY: -this.viewportState.translateY,
        scale: this.viewportState.scale,
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      const x = event.clientX;
      const y = event.clientY;

      this.engineState.currentPath = new KritzelPath({
        points: [...this.engineState.currentPath.points, [x, y]],
        translateX: -this.viewportState.translateX,
        translateY: -this.viewportState.translateY,
        scale: this.viewportState.scale,
      });
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isDrawing) {
      this.isDrawing = false;

      if (this.engineState.currentPath) {
        this.engineState.paths.push(this.engineState.currentPath);
      }

      this.engineState.currentPath = undefined;
    }
  }

  handleWheel(_event: WheelEvent): void {
    //TODO: Update paths's scaling factor
    throw new Error('Method not implemented.');
  }
}
