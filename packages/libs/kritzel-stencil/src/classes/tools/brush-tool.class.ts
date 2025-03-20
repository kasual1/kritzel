import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelTool } from '../../interfaces/tool.interface';
import { kritzelEngineState } from '../../stores/engine.store';
import { KritzelStore } from '../../stores/store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KritzelPath } from '../objects/path.class';

export class KritzelBrushTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  name: string = 'brush';
  icon: string = 'brush';

  isDrawing: boolean;

  currentPath: KritzelPath | undefined;

  store: KritzelStore;

  constructor(store: KritzelStore) {
    this.store = store;
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

      this.store.state.currentPath = new KritzelPath({
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

      this.store.state.currentPath = new KritzelPath({
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
        kritzelEngineState.currentPath.initializeZIndex();
        kritzelEngineState.objects.push(kritzelEngineState.currentPath);
      }

      if(this.store.state.currentPath){
        this.store.state.currentPath.zIndex = this.store.currentZIndex;
        this.store.state.objects.push(this.store.state.currentPath);
      }

      kritzelEngineState.currentPath = undefined;
      this.store.state.currentPath = undefined;
    }
  }

  handleWheel(_event: WheelEvent): void {
    //TODO: Update paths's scaling factor
  }

  revive(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }
}
