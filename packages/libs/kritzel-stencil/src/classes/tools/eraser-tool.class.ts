import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelStore } from "../../stores/store";
import { KritzelBaseTool } from "./base-tool.class";

export class KritzelEraserTool extends KritzelBaseTool {
  name: string = 'eraser';
  icon: string = 'eraser';

  constructor(store: KritzelStore){
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      this._store.state.isErasing = true;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isErasing) {
        const path = event.composedPath() as HTMLElement[];
        const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

        if (selectedObject) {
          for (const object of this._store.state.objects) {
            if (selectedObject.id === object.id) {
              object.markedForRemoval = true;
            }
          }
        }

        this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if(this._store.state.isErasing) {
      this._store.state.objects = this._store.state.objects.filter((o) => o.markedForRemoval === false);
      this._store.state.isErasing = false;
    }
  }

}
