import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class RotateSelectionGroupCommand extends KritzelBaseCommand {

  private rotation: number;

  private initialRotation: number;

  private selectionGroup: KritzelSelectionGroup;

  constructor(core: KritzelCore, initiator: any, rotation: number, initialRotation: number, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.rotation = rotation;
    this.initialRotation = initialRotation;
    this.selectionGroup = this._core.store.state.selectionGroup;
  }

  execute(): void {
    this._core.store.state.selectionGroup = this.selectionGroup;
    this._core.store.state.selectionGroup.rotate(this.rotation);
    this._core.store.state.selectionGroup.objects.forEach(object => {
      this._core.store.state.objectsMap.update(object);
      this._core.updateObjectInDatabase(object);
    });
  }

  undo(): void {
    this._core.store.state.selectionGroup = this.selectionGroup;
    this._core.store.state.selectionGroup.rotate(this.initialRotation);
    this._core.store.state.selectionGroup.objects.forEach(object => {
      this._core.store.state.objectsMap.update(object);
      this._core.updateObjectInDatabase(object);
    });
  }
}
