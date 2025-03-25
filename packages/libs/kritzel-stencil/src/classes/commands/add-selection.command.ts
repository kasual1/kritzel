import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class AddSelectionCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;

  constructor(store, selectionGroup: KritzelSelectionGroup) {
    super(store);
    this.selectionGroup = selectionGroup;
  }

  execute(): void {
    this._store.state.objects = [...this._store.objectsWithoutSelectionBox, this.selectionGroup];
    this._store.state.selectionGroup = this.selectionGroup;
  }

  undo(): void {
    this._store.state.objects = this._store.state.objects.filter(object => object.id !== this.selectionGroup.id);
    this._store.state.selectionGroup = null;
  }
}
