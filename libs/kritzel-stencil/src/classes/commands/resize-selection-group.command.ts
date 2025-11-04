import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class ResizeSelectionGroupCommand extends KritzelBaseCommand {

  private newSize: {x: number, y: number, width: number, height: number};

  private previousSize: {x: number, y: number, width: number, height: number};

  private selectionGroup: KritzelSelectionGroup;

  constructor(core: KritzelCore, initiator: any, previousSize: {x: number, y: number, width: number, height: number}, newSize: {x: number, y: number, width: number, height: number}, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.previousSize = previousSize;
    this.newSize = newSize;
    this.selectionGroup = this._core.store.selectionGroup;
  }

  execute(): void {
    this.selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);
    this.selectionGroup.objects.forEach(object => {
      this._core.store.state.objectsMap.update(object);
      this._core.updateObjectInDatabase(object);
    });
  }

  undo(): void {
    this.selectionGroup.resize(this.previousSize.x, this.previousSize.y, this.previousSize.width, this.previousSize.height);
    this.selectionGroup.objects.forEach(object => {
      this._core.store.state.objectsMap.update(object);
      this._core.updateObjectInDatabase(object);
    });
  }
}
