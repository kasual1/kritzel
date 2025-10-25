import { KritzelBaseCommand } from '../commands/base.command';
import { UpdateViewportCommand } from '../commands/update-viewport.command';
import { KritzelCore } from './core.class';
import { KritzelCircularBuffer } from '../structures/circular-buffer.structure';

export class KritzelHistory {
  private readonly _core: KritzelCore;

  undoStack: KritzelCircularBuffer<KritzelBaseCommand>;
  redoStack: KritzelCircularBuffer<KritzelBaseCommand>;

 

  constructor(core: KritzelCore) {
    this._core = core;
    this.undoStack = new KritzelCircularBuffer<KritzelBaseCommand>(this._core.store.state.historyBufferSize);
    this.redoStack = new KritzelCircularBuffer<KritzelBaseCommand>(this._core.store.state.historyBufferSize);
  }

  reset() {
    this.undoStack.clear();
    this.redoStack.clear();
    this._core.commandManager.previousViewport = {
      scale: this._core.store.state.scale,
      scaleStep: this._core.store.state.scaleStep,
      translateX: this._core.store.state.translateX,
      translateY: this._core.store.state.translateY
    };
  }


  undo() {
    if (this._core.store.state.hasViewportChanged) {
      const command = new UpdateViewportCommand(this._core, this, this._core.commandManager.previousViewport);
      command.undo();
      this._core.store.state.hasViewportChanged = false;
      this._core.rerender();
      return;
    }

    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      if (this._core.store.state.debugInfo.logCommands) console.info('undo', command);
      this.redoStack.add(command);
    }

    this._core.store.state.copiedObjects = null;
    this._core.rerender();
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      if (this._core.store.state.debugInfo.logCommands) console.info('redo', command);
      this.undoStack.add(command);
    }

    this._core.rerender();
  }
}
