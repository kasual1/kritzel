import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class ResizeSelectionGroupCommand extends KritzelBaseCommand {

  private newSize: {x: number, y: number, width: number, height: number};

  private previousSize: {x: number, y: number, width: number, height: number};

  private selectionGroup: KritzelSelectionGroup;

  constructor(store, initiator: any, previousSize: {x: number, y: number, width: number, height: number}, newSize: {x: number, y: number, width: number, height: number}) {
    super(store, initiator);
    this.previousSize = previousSize;
    this.newSize = newSize;
    this.selectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    this._store.state.selectionGroup = this.selectionGroup;
    this._store.state.selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);
  }

  undo(): void {
    this._store.state.selectionGroup = this.selectionGroup;
    this._store.state.selectionGroup.resize(this.previousSize.x, this.previousSize.y, this.previousSize.width, this.previousSize.height);
  }
}
