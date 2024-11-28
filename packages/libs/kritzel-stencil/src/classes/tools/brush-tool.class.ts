import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelTool } from '../../interfaces/tool.interface';
import { kritzelEngineState } from '../../stores/engine.store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KritzelPath } from '../objects/path.class';

export class KritzelBrushTool implements KritzelTool {
  name: string = 'brush';
  icon: string = 'brush';

  isDrawing: boolean;

  currentPath: KritzelPath | undefined;

  constructor() {
    this.isDrawing = false;
  }

  handleMouseDown(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.isDrawing = true;
      const x = event.clientX;
      const y = event.clientY;

      kritzelEngineState.currentPath = new KritzelPath({
        points: [[x, y]],
        translateX: -kritzelViewportState.translateX,
        translateY: -kritzelViewportState.translateY,
        scale: kritzelViewportState.scale,
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      const x = event.clientX;
      const y = event.clientY;

      kritzelEngineState.currentPath = new KritzelPath({
        points: [...kritzelEngineState.currentPath.points, [x, y]],
        translateX: -kritzelViewportState.translateX,
        translateY: -kritzelViewportState.translateY,
        scale: kritzelViewportState.scale,
      });
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isDrawing) {
      this.isDrawing = false;

      if (kritzelEngineState.currentPath) {
        kritzelEngineState.objects.push(kritzelEngineState.currentPath);
      }

      kritzelEngineState.currentPath = undefined;
    }
  }

  handleWheel(_event: WheelEvent): void {
    //TODO: Update paths's scaling factor
  }
}
