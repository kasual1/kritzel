import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { KritzelBaseCommand } from '../commands/base.command';
import { UpdateViewportCommand } from '../commands/update-viewport.command';
import { KritzelCore } from './core.class';

export class KritzelCommandManager {
  private _core: KritzelCore;

  private readonly _history;

  previousViewport: {
    scale: number;
    scaleStep: number;
    translateX: number;
    translateY: number;
  };

  constructor(core: KritzelCore) {
    this._core = core;
    this._history = this._core.history;
    this.previousViewport = {
      scale: this._core.store.state.scale,
      scaleStep: this._core.store.state.scaleStep,
      translateX: this._core.store.state.translateX,
      translateY: this._core.store.state.translateY,
    };
  }

  executeCommand(command: KritzelBaseCommand) {
    if (this._core.store.state.hasViewportChanged) {
      this.addUpdateViewportCommand();
    }

    command.execute();

    if (this.isSkipped(command) === false) {
      if (this._core.store.state.debugInfo.logCommands) {
        console.log('execute', command);
      }

      this._history.undoStack.add(command);

      if (this._history.redoStack.isEmpty() === false) {
        this._history.redoStack.clear();
      }
    }

    this._core.rerender();
  }

  private isSkipped(command: KritzelBaseCommand): boolean {
    if( command instanceof AddSelectionGroupCommand) {
      const hasOnlyOneTextObjects = this._core.store.state.selectionGroup?.objects.every(obj => obj.__class__ === 'KritzelText');
      return hasOnlyOneTextObjects && this._core.store.state.selectionGroup?.objects.length === 1;
    }

    return command.skipHistory === true
  }

  private addUpdateViewportCommand() {
    const command = new UpdateViewportCommand(this._core, this, this.previousViewport);
    command.execute();
    this._history.undoStack.add(command);

    if (this._history.redoStack.isEmpty() === false) {
      this._history.redoStack.clear();
    }

    this._core.store.state.hasViewportChanged = false;
    this.previousViewport = {
      scale: this._core.store.state.scale,
      scaleStep: this._core.store.state.scaleStep,
      translateX: this._core.store.state.translateX,
      translateY: this._core.store.state.translateY,
    };
  }
}
