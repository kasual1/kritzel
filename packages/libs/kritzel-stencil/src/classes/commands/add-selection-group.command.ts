import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class AddSelectionGroupCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;

  constructor(store, initiator: any, selectionGroup: KritzelSelectionGroup) {
    super(store, initiator);
    this.selectionGroup = selectionGroup;
  }

  execute(): void {
    this._store.state.objectsOctree.remove(object => object instanceof KrtizelSelectionBox);
    this._store.state.objectsOctree.insert(this.selectionGroup, this.selectionGroup.boundingBox);
    this._store.state.selectionGroup = this.selectionGroup;
  }

  undo(): void {
    this._store.state.objectsOctree.remove(object => object.id === this.selectionGroup.id);
    this._store.state.selectionGroup = null;
  }
}
