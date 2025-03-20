import { KritzelTool } from "../../components";
import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelSerializable } from "../../interfaces/serializable.interface";
import { kritzelEngineState } from "../../stores/engine.store";
import { KritzelStore } from "../../stores/store";

export class KritzelEraserTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  name: string = 'eraser';
  icon: string = 'eraser';

  isErasing: boolean;

  store: KritzelStore;

  constructor(store: KritzelStore){
    this.store = store;
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.isErasing = true;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.isErasing) {
        const path = event.composedPath() as HTMLElement[];
        const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

        if (selectedObject) {
          for (const object of kritzelEngineState.objects) {
            if (selectedObject.id === object.id) {
              object.markedForRemoval = true;
            }
          }
        }

        kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if(this.isErasing) {
      kritzelEngineState.objects = kritzelEngineState.objects.filter((o) => o.markedForRemoval === false);
      this.isErasing = false;
    }
  }

  handleWheel(_event: WheelEvent): void {
    // Do nothing
  }

  revive(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }

}
