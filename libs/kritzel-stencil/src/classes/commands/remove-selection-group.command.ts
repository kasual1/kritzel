import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class RemoveSelectionGroupCommand extends KritzelBaseCommand {

  private previousSelectionGroup: KritzelSelectionGroup;

  constructor(core: KritzelCore, initiator: any, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.previousSelectionGroup = this._core.state.selectionGroup;
  }

  execute(): void {
    this._core.state.objectsMap.remove(object => object.id === this.previousSelectionGroup?.id);
    this._core.state.selectionGroup = null;
  }

  undo(): void {
    if(this.previousSelectionGroup) {
      this._core.state.objectsMap.insert(this.previousSelectionGroup);
      this._core.state.selectionGroup = this.previousSelectionGroup;
    } 
  }
}
