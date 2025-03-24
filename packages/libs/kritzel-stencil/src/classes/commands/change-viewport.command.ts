import { KritzelBaseCommand } from './base.command';

export class ChangeViewportCommand extends KritzelBaseCommand {

  previousViewport: {
    scale: number;
    translateX: number;
    translateY: number;
  };

  constructor(store, previousViewport: {
    scale: number;
    translateX: number;
    translateY: number;
  }) {
    super(store);
    this.previousViewport = previousViewport
  }

  execute(): void {
    super.execute();
  }

  undo(): void {
    this._store.state.scale = this.previousViewport.scale;
    this._store.state.translateX = this.previousViewport.translateX;
    this._store.state.translateY = this.previousViewport.translateY;
  }
}
