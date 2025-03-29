import { KritzelBaseCommand } from './commands/base.command';
import { UpdateViewportCommand } from './commands/update-viewport.command';
import { KritzelStore } from './store.class';

export class KritzelHistory {
  private readonly _store: KritzelStore;

  undoStack: KritzelBaseCommand[] = [];
  redoStack: KritzelBaseCommand[] = [];

  previousViewport: {
    scale: number;
    scaleStep: number;
    translateX: number;
    translateY: number;
  };

  constructor(store: KritzelStore) {
    this._store = store;
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
      this.undoStack.push(command);
      this.redoStack = this.redoStack.length > 0 ? [] : this.redoStack;
      this._store.state.hasViewportChanged = false;
      this.previousViewport = {
        scale: this._store.state.scale,
        scaleStep: this._store.state.scaleStep,
        translateX: this._store.state.translateX,
        translateY: this._store.state.translateY,
      };
    }

    command.execute();
    if(this._store.state.showDebugInfo) console.info('add', command);
    this.undoStack.push(command);
    this.redoStack = this.redoStack.length > 0 ? [] : this.redoStack;
  }

  undo() {
    if (this._store.state.hasViewportChanged) {
      const command = new UpdateViewportCommand(this._store, this, this.previousViewport);
      command.undo();
      this._store.state.hasViewportChanged = false;
      return;
    }

    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      if(this._store.state.showDebugInfo) console.info('undo', command);
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      if(this._store.state.showDebugInfo) console.info('redo', command);
      this.undoStack.push(command);
    }
  }
}
