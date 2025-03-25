import { KritzelStore } from '../../stores/store';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class ClearSelectionCommand extends KritzelBaseCommand {

  private previousSelectionGroup: KritzelSelectionGroup;

  constructor(store: KritzelStore) {
    super(store);
    this.previousSelectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    this._store.state.objects = this._store.state.objects
        .filter(object => !(object instanceof KrtizelSelectionBox))
        .filter(object => !(object instanceof KritzelSelectionGroup));

    this._store.state.selectionGroup = null;
  }

  undo(): void {
    this._store.state.objects = [...this._store.state.objects, this.previousSelectionGroup];

    this._store.state.selectionGroup = this.previousSelectionGroup;
  }
}
