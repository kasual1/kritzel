import { KritzelCore } from '../core/core.class';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class AddSelectionGroupCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;

  constructor(core: KritzelCore, initiator: any, selectionGroup: KritzelSelectionGroup, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.selectionGroup = selectionGroup;
  }

  execute(): void {
    this._core.state.objectsMap.remove(object => object instanceof KrtizelSelectionBox);
    this._core.state.objectsMap.insert(this.selectionGroup);
    this._core.state.selectionGroup = this.selectionGroup;
    this._core.state.selectionBox = null;
  }

  undo(): void {
    this._core.state.objectsMap.remove(object => object.id === this.selectionGroup.id);
    this._core.state.selectionGroup = null;
    this._core.state.selectionBox = null;
  }
}
