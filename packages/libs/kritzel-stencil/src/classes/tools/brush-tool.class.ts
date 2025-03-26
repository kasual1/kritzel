import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../../stores/store';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelPath } from '../objects/path.class';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelBrushTool extends KritzelBaseTool {
  name: string = 'brush';
  icon: string = 'brush';

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this._store.state.isDrawing = true;
      const x = event.clientX;
      const y = event.clientY;

      this._store.state.currentPath = new KritzelPath(this._store, {
        points: [[x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isDrawing) {
      const x = event.clientX;
      const y = event.clientY;

      this._store.state.currentPath = new KritzelPath(this._store,{
        points: [...this._store.state.currentPath.points, [x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
      });
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isDrawing) {
      this._store.state.isDrawing = false;

      if(this._store.state.currentPath){
        this._store.state.currentPath.zIndex = this._store.currentZIndex;
        this._store.executeCommand(new AddObjectCommand(this._store, this, this._store.state.currentPath));
      }

      this._store.state.currentPath = undefined;
    }
  }
}
