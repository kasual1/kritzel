import { KritzelBaseCommand } from './commands/base.command';
import { UpdateViewportCommand } from './commands/update-viewport.command';
import { KritzelStore } from './store.class';
import { KritzelCircularBuffer } from './structures/circular-buffer.structure';

export class KritzelHistory {
  private readonly _store: KritzelStore;

  undoStack: KritzelCircularBuffer<KritzelBaseCommand>;
  redoStack: KritzelCircularBuffer<KritzelBaseCommand>;

  previousViewport: {
    scale: number;
    scaleStep: number;
    translateX: number;
    translateY: number;
  };

  constructor(store: KritzelStore) {
    this._store = store;
    this.undoStack = new KritzelCircularBuffer<KritzelBaseCommand>(this._store.state.historyBufferSize);
    this.redoStack = new KritzelCircularBuffer<KritzelBaseCommand>(this._store.state.historyBufferSize);
    this.previousViewport = {
      scale: this._store.state.scale,
      scaleStep: this._store.state.scaleStep,
      translateX: this._store.state.translateX,
      translateY: this._store.state.translateY,
    };
  }

  executeCommand(command: KritzelBaseCommand) {
    if (this._store.state.hasViewportChanged) {
      const command = new UpdateViewportCommand(this._store, this, this.previousViewport);
      command.execute();
      this.undoStack.add(command);

      if (this.redoStack.isEmpty() === false) {
        this.redoStack.clear();
      }

      this._store.state.hasViewportChanged = false;
      this.previousViewport = {
        scale: this._store.state.scale,
        scaleStep: this._store.state.scaleStep,
        translateX: this._store.state.translateX,
        translateY: this._store.state.translateY,
      };
    }

    command.execute();
    if (this._store.state.debugInfo.logCommands) console.info('add', command);
    this.undoStack.add(command);

    if (this.redoStack.isEmpty() === false) {
      this.redoStack.clear();
    }

    this._store.rerender();
  }

  undo() {
    if (this._store.state.hasViewportChanged) {
      const command = new UpdateViewportCommand(this._store, this, this.previousViewport);
      command.undo();
      this._store.state.hasViewportChanged = false;
      this._store.rerender();
      return;
    }

    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      if (this._store.state.debugInfo.logCommands) console.info('undo', command);
      this.redoStack.add(command);
    }

    this._store.rerender();
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      if (this._store.state.debugInfo.logCommands) console.info('redo', command);
      this.undoStack.add(command);
    }

    this._store.rerender();
  }
}
