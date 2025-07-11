import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class RotateSelectionGroupCommand extends KritzelBaseCommand {

  private rotation: number;

  private initialRotation: number;

  private selectionGroup: KritzelSelectionGroup;

  constructor(store, initiator: any, rotation: number) {
    super(store, initiator);
    this.rotation = rotation;
    this.initialRotation = this._store.state.selectionGroup.rotation;
    this.selectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    this._store.state.selectionGroup = this.selectionGroup;
    this._store.state.selectionGroup.rotate(this.rotation);
    this._store.state.selectionGroup.objects.forEach(object => {
      this._store.state.objectsOctree.update(object);
    });
  }

  undo(): void {
    this._store.state.selectionGroup = this.selectionGroup;
    this._store.state.selectionGroup.rotate(this.rotation - this.initialRotation);
    this._store.state.selectionGroup.objects.forEach(object => {
      this._store.state.objectsOctree.update(object);
    });
  }
}
