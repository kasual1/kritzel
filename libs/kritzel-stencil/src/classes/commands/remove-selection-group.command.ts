import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class RemoveSelectionGroupCommand extends KritzelBaseCommand {

  private previousSelectionGroup: KritzelSelectionGroup;

  constructor(core: KritzelCore, initiator: any, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.previousSelectionGroup = this._core.store.selectionGroup;
  }

  execute(): void {
    this._core.store.state.objectsMap.remove(object => object.id === this.previousSelectionGroup?.id);
  }

  undo(): void {
    if(this.previousSelectionGroup) {
      this._core.store.state.objectsMap.insert(this.previousSelectionGroup);
    } 
  }
}
