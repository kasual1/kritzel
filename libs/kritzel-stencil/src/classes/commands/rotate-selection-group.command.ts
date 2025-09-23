import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class RotateSelectionGroupCommand extends KritzelBaseCommand {

  private rotation: number;

  private initialRotation: number;

  private selectionGroup: KritzelSelectionGroup;

  constructor(core: KritzelCore, initiator: any, rotation: number, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.rotation = rotation;
    this.initialRotation = this._core.state.selectionGroup.rotation;
    this.selectionGroup = this._core.state.selectionGroup;
  }

  execute(): void {
    this._core.state.selectionGroup = this.selectionGroup;
    this._core.state.selectionGroup.rotate(this.rotation);
    this._core.state.selectionGroup.objects.forEach(object => {
      this._core.state.objectsMap.update(object);
    });
  }

  undo(): void {
    this._core.state.selectionGroup = this.selectionGroup;
    this._core.state.selectionGroup.rotate(this.rotation - this.initialRotation);
    this._core.state.selectionGroup.objects.forEach(object => {
      this._core.state.objectsMap.update(object);
    });
  }
}
