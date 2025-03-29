import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelStore } from "../store.class";
import { BatchCommand } from "../commands/batch.command";
import { RemoveObjectCommand } from "../commands/remove-object.command";
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

      const removeCommands = this._store.state.objects
        .filter(object => object.markedForRemoval)
        .map(object => {
          object.markedForRemoval = false;
          return new RemoveObjectCommand(this._store, this, object);
        });

      if(removeCommands.length > 0) {
        this._store.history.executeCommand(new BatchCommand(this._store, this, removeCommands));
      }

      this._store.state.isErasing = false;
    }
  }

}
