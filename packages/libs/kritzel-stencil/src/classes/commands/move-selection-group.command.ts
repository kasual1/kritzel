import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class MoveSelectionGroupCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;

  private startX: number;

  private startY: number;

  private endX: number;

  private endY: number;

  private skipExecution: boolean;

  constructor(store, initiator: any, startX: number, startY: number, endX: number, endY: number, skipExecution = false) {
    super(store, initiator);
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.skipExecution = skipExecution;
    this.selectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    if(this.skipExecution) {
      this.skipExecution = false;
      return;
    }
    
    this._store.state.selectionGroup = this.selectionGroup;
    this._store.state.selectionGroup.move(this.startX, this.startY, this.endX, this.endY);
  }

  undo(): void {
    this._store.state.selectionGroup = this.selectionGroup;
    this._store.state.selectionGroup.move(this.endX, this.endY, this.startX, this.startY);
  }
}
