import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class MoveSelectionGroupCommand extends KritzelBaseCommand {
  private selectionGroup: KritzelSelectionGroup;

  private startX: number;

  private startY: number;

  private endX: number;

  private endY: number;

  private skipExecution: boolean;

  constructor(core: KritzelCore, initiator: any, startX: number, startY: number, endX: number, endY: number, skipFirstExecution = false, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.skipExecution = skipFirstExecution;
    this.selectionGroup = this._core.store.state.selectionGroup;
  }

  execute(): void {
    if (this.skipExecution) {
      this.skipExecution = false;
      return;
    }

    this._core.store.setState('selectionGroup', this.selectionGroup);
    this._core.store.state.selectionGroup.move(this.startX, this.startY, this.endX, this.endY);
  }

  undo(): void {
    this._core.store.setState('selectionGroup', this.selectionGroup);
    this._core.store.state.selectionGroup.move(this.endX, this.endY, this.startX, this.startY);
  }
}
