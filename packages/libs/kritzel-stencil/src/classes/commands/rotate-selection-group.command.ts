import { KritzelBaseCommand } from './base.command';

export class RotatedSelectionGroupCommand extends KritzelBaseCommand {

  private rotation: number;

  private initialRotation: number;

  constructor(store, initiator: any, rotation: number) {
    super(store, initiator);
    this.rotation = rotation;
    this.initialRotation = this._store.state.selectionGroup.rotation;
  }

  execute(): void {
    this._store.state.selectionGroup.rotate(this.rotation);
    this._store.rerender();
    
  }

  undo(): void {
    this._store.state.selectionGroup.rotate(this.rotation - this.initialRotation);
    this._store.rerender();
  }
}
