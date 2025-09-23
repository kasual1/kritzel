import { KritzelBaseCommand } from '../commands/base.command';
import { UpdateViewportCommand } from '../commands/update-viewport.command';
import { KritzelCore } from './core.class';
import { KritzelCircularBuffer } from '../structures/circular-buffer.structure';

export class KritzelHistory {
  private readonly _core: KritzelCore;

  undoStack: KritzelCircularBuffer<KritzelBaseCommand>;
  redoStack: KritzelCircularBuffer<KritzelBaseCommand>;

  previousViewport: {
    scale: number;
    scaleStep: number;
    translateX: number;
    translateY: number;
  };

  constructor(core: KritzelCore) {
    this._core = core;
    this.undoStack = new KritzelCircularBuffer<KritzelBaseCommand>(this._core.state.historyBufferSize);
    this.redoStack = new KritzelCircularBuffer<KritzelBaseCommand>(this._core.state.historyBufferSize);
    this.previousViewport = {
      scale: this._core.state.scale,
      scaleStep: this._core.state.scaleStep,
      translateX: this._core.state.translateX,
      translateY: this._core.state.translateY,
    };
  }

  reset() {
    this.undoStack.clear();
    this.redoStack.clear();
    this.previousViewport = {
      scale: this._core.state.scale,
      scaleStep: this._core.state.scaleStep,
      translateX: this._core.state.translateX,
      translateY: this._core.state.translateY
    };
  }

  executeCommand(command: KritzelBaseCommand) {
    if (this._core.state.hasViewportChanged) {
      this.addUpdateViewportCommand();
    }

    command.execute();

    if (command.skipHistory === false) {
      if (this._core.state.debugInfo.logCommands) {
        console.info('add', command);
      }

      this.undoStack.add(command);

      if (this.redoStack.isEmpty() === false) {
        this.redoStack.clear();
      }
    }

    this._core.rerender();
  }

  undo() {
    if (this._core.state.hasViewportChanged) {
      const command = new UpdateViewportCommand(this._core, this, this.previousViewport);
      command.undo();
      this._core.state.hasViewportChanged = false;
      this._core.rerender();
      return;
    }

    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      if (this._core.state.debugInfo.logCommands) console.info('undo', command);
      this.redoStack.add(command);
    }

    this._core.rerender();
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      if (this._core.state.debugInfo.logCommands) console.info('redo', command);
      this.undoStack.add(command);
    }

    this._core.rerender();
  }

  private addUpdateViewportCommand() {
    const command = new UpdateViewportCommand(this._core, this, this.previousViewport);
    command.execute();
    this.undoStack.add(command);

    if (this.redoStack.isEmpty() === false) {
      this.redoStack.clear();
    }

    this._core.state.hasViewportChanged = false;
    this.previousViewport = {
      scale: this._core.state.scale,
      scaleStep: this._core.state.scaleStep,
      translateX: this._core.state.translateX,
      translateY: this._core.state.translateY,
    };
  }
}
