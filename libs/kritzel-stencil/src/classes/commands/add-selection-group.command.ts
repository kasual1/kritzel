import { KritzelCore } from '../core/core.class';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class AddSelectionGroupCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;
  private previousSelectionGroup: KritzelSelectionGroup | null;

  constructor(core: KritzelCore, initiator: any, selectionGroup: KritzelSelectionGroup, previousSelectionGroup?: KritzelSelectionGroup, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.selectionGroup = selectionGroup;
    this.previousSelectionGroup = previousSelectionGroup || null;
  }

  execute(): void {
    this._core.store.state.objectsMap.remove(object => object instanceof KrtizelSelectionBox || object instanceof KritzelSelectionGroup);
    this._core.store.state.objectsMap.insert(this.selectionGroup);

    this._core.store.state.selectionGroup = this.selectionGroup;
  }

  undo(): void {
    this._core.store.state.objectsMap.remove(object => object.id === this.selectionGroup.id);
    this._core.store.state.selectionGroup = this.previousSelectionGroup;
  }
}
