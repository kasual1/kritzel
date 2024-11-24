import { KritzelTool } from "../components";
import { KritzelClickHelper } from "../helpers/click.helper";
import { kritzelEngineState } from "../stores/engine.store";
import { kritzelViewportState } from "../stores/viewport.store";
import { KritzelObjectBase } from "./object.class";

export class KritzelEraserTool implements KritzelTool {
  name: string = 'eraser';
  icon: string = 'eraser';

  isErasing: boolean;

  objectsMarkedForRemoval: KritzelObjectBase[] = [];

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.isErasing = true;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.isErasing) {
      const { clientX, clientY } = event;

			for (const object of kritzelEngineState.objects) {
				if (object.isPointInBoundingBox(clientX, clientY)) {
          object.markedForRemoval = true;
          this.objectsMarkedForRemoval.push(object);
				}
			}

			const selectedObjects = kritzelEngineState.objects.filter((object) => object.selected);
			kritzelEngineState.selectedObjects = selectedObjects;
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if(this.isErasing) {
      for (const object of this.objectsMarkedForRemoval) {
        kritzelEngineState.objects = kritzelEngineState.objects.filter((o) => o.id !== object.id);
      }

      this.objectsMarkedForRemoval = [];
      this.isErasing = false;
    }
  }

  handleWheel(_event: WheelEvent): void {
  }

}
