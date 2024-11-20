import { ClickHelper } from '../helpers/click.helper';
import { Tool } from '../interfaces/tool.interface';
import { KritzelEngineState } from '../stores/kritzel-engine.store';
import { Path } from './path.class';

export class Brush implements Tool {
  name: string = 'brush';
  icon: string = 'brush';

  isDrawing: boolean = false;

  currentPath: Path | undefined;
  currentPathPoints: number[][] = [];

  constructor() {}

  handleMouseDown(ev: MouseEvent, state: KritzelEngineState) {
    if (ClickHelper.isLeftClick(ev)) {
      this.isDrawing = true;
      const x = ev.clientX;
      const y = ev.clientY;

      this.currentPathPoints.push([x, y]);
      this.currentPath = new Path({
        points: this.currentPathPoints,
        translateX: -state.translateX,
        translateY: -state.translateY,
        scale: state.scale,
      });
    }
  }

  handleMouseMove(event: MouseEvent, state: KritzelEngineState): void {
    throw new Error('Method not implemented.');
  }
  handleMouseUp(event: MouseEvent, state: KritzelEngineState): void {
    throw new Error('Method not implemented.');
  }
  handleWheel(event: WheelEvent, state: KritzelEngineState): void {
    throw new Error('Method not implemented.');
  }
}
