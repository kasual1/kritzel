import { KritzelBaseCommand } from './base.command';

export class ChangeViewportCommand extends KritzelBaseCommand {

  currentViewport: {
    scale: number;
    translateX: number;
    translateY: number;
  };

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
    this.currentViewport = {
      scale: this._store.state.scale,
      translateX: this._store.state.translateX,
      translateY: this._store.state.translateY,
    };
  }

  execute(): void {
    this._store.state.scale = this.currentViewport.scale;
    this._store.state.translateX = this.currentViewport.translateX;
    this._store.state.translateY = this.currentViewport.translateY;  
  }

  undo(): void {
    this._store.state.scale = this.previousViewport.scale;
    this._store.state.translateX = this.previousViewport.translateX;
    this._store.state.translateY = this.previousViewport.translateY;
  }
}
