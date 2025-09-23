import { KritzelCore } from '../core/core.class';
import { KritzelBaseCommand } from './base.command';

export class UpdateViewportCommand extends KritzelBaseCommand {
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

  constructor(
    core: KritzelCore,
    initiator: any,
    previousViewport: {
      scale: number;
      translateX: number;
      translateY: number;
    },
    skipHistory = false,
  ) {
    super(core, initiator, skipHistory);
    this.previousViewport = previousViewport;
    this.currentViewport = {
      scale: this._core.state.scale,
      translateX: this._core.state.translateX,
      translateY: this._core.state.translateY,
    };
  }

  execute(): void {
    this._core.store.setState('scale', this.currentViewport.scale);
    this._core.store.setState('translateX', this.currentViewport.translateX);
    this._core.store.setState('translateY', this.currentViewport.translateY);
  }

  undo(): void {
    this._core.store.setState('scale', this.previousViewport.scale);
    this._core.store.setState('translateX', this.previousViewport.translateX);
    this._core.store.setState('translateY', this.previousViewport.translateY);
  }
}
