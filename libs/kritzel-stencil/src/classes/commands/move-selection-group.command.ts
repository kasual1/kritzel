import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class MoveSelectionGroupCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;

  private startX: number;

  private startY: number;

  private endX: number;

  private endY: number;

  private skipExecution: boolean;

  constructor(core: KritzelCore, initiator: any, startX: number, startY: number, endX: number, endY: number, skipFirstExecution = false, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.skipExecution = skipFirstExecution;
    this.selectionGroup = this._core.store.selectionGroup;
  }

  execute(): void {
    if (this.skipExecution) {
      this.skipExecution = false;
      // Skip execution, but still update objects
      this.selectionGroup.objects.forEach(object => {
        this._core.store.state.objectsMap.update(object);
        this._core.updateObjectInDatabase(object);
      });
      return;
    }

    this.selectionGroup.move(this.startX, this.startY, this.endX, this.endY);
    this.selectionGroup.objects.forEach(object => {
      this._core.store.state.objectsMap.update(object);
      this._core.updateObjectInDatabase(object);
    });
  }

  undo(): void {
    this.selectionGroup.move(this.endX, this.endY, this.startX, this.startY);
    this.selectionGroup.objects.forEach(object => {
      this._core.store.state.objectsMap.update(object);
      this._core.updateObjectInDatabase(object);
    });
  }
}
