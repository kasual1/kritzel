import { KritzelStore } from '../../stores/store';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class RemoveSelectionGroupCommand extends KritzelBaseCommand {

  private previousSelectionGroup: KritzelSelectionGroup;

  constructor(store: KritzelStore, initiator: any) {
    super(store, initiator);
    this.previousSelectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    this._store.state.objects = this._store.state.objects.filter(object => !(object instanceof KritzelSelectionGroup));
    this._store.state.selectionGroup = null;
  }

  undo(): void {
    this._store.state.objects = [...this._store.state.objects, this.previousSelectionGroup];
    this._store.state.selectionGroup = this.previousSelectionGroup;
  }
}
