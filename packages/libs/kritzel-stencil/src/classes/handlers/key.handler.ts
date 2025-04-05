import { KritzelStore } from '../store.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBrushTool } from '../tools/brush-tool.class';
import { KritzelEraserTool } from '../tools/eraser-tool.class';
import { KritzelImageTool } from '../tools/image-tool.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelKeyHandler extends KritzelBaseHandler {
  constructor(store: KritzelStore) {
    super(store);
  }

  handleKeyDown(event: KeyboardEvent): void {
    this._store.state.isCtrlKeyPressed = event.ctrlKey;

    if(this._store.state.isCtrlKeyPressed) {
      event.preventDefault();
    }

    if (event.key === 'Escape' && this._store.state.selectionGroup) {
      this.handleEscape();
    }

    if (event.key === 'Delete' && this._store.state.selectionGroup) {
      this.handleDelete();
    }

    if (event.key === 'z' && event.ctrlKey) {
      this._store.history.undo();
    }

    if (event.key === 'y' && event.ctrlKey) {
      this._store.history.redo();
    }

    if (event.key === 'd' && event.ctrlKey) {
      this._store.state.debugInfo.showViewportInfo = !this._store.state.debugInfo.showViewportInfo;
      this._store.state.debugInfo.showObjectInfo = !this._store.state.debugInfo.showObjectInfo;
      this._store.state.debugInfo.logCommands = !this._store.state.debugInfo.logCommands;
      this._store.rerender();
    }

    if (event.key === 's' && event.ctrlKey) {
      this._store.state.activeTool = new KritzelSelectionTool(this._store);
      this._store.deselectAllObjects();
    }

    if (event.key === 'b' && event.ctrlKey) {
      this._store.state.activeTool = new KritzelBrushTool(this._store);
      this._store.deselectAllObjects();
    }

    if (event.key === 'e' && event.ctrlKey) {
      this._store.state.activeTool = new KritzelEraserTool(this._store);
      this._store.deselectAllObjects();
    }

    if (event.key === 'i' && event.ctrlKey) {
      this._store.state.activeTool = new KritzelImageTool(this._store);
      this._store.deselectAllObjects();
    }

    if (event.key === 'x' && event.ctrlKey) {
      this._store.state.activeTool = new KritzelTextTool(this._store);
      this._store.deselectAllObjects();
    }

    if (event.key === 'c' && event.ctrlKey && this._store.state.selectionGroup) {
      this.handleCopy();
    }

    if (event.key === 'v' && event.ctrlKey && this._store.state.selectionGroup) {
      this.handlePaste();
    }

    if (event.key === '+' && event.ctrlKey && this._store.state.selectionGroup) {
      this.handleMoveUp();
    }

    if (event.key === '-' && event.ctrlKey && this._store.state.selectionGroup) {
      this.handleMoveDown();
    }

    if (event.key === '*' && event.shiftKey && this._store.state.selectionGroup) {
      this.handleMoveToTop();
    }

    if (event.key === '_' && event.shiftKey && this._store.state.selectionGroup) {
      this.handleMoveToBottom();
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    this._store.state.isCtrlKeyPressed = event.ctrlKey;
  }

  private handleEscape() {
    this._store.history.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
  }

  private handleDelete() {
    const deleteSelectedObjectsCommand = this._store.state.selectionGroup.objects.map(obj => new RemoveObjectCommand(this._store, this._store.state.selectionGroup, obj));
    const removeSelectionGroupCommand = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    const commands = [...deleteSelectedObjectsCommand, removeSelectionGroupCommand];

    this._store.history.executeCommand(new BatchCommand(this._store, this._store.state.selectionGroup, commands));
  }

  private handleCopy() {
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handlePaste() {
    this._store.state.copiedObjects.selected = true;

    const removeCurrentSelectionGroupCommand = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    const addCopiedObjectsCommands = this._store.state.copiedObjects.objects.map(obj => new AddObjectCommand(this._store, this, obj));
    const addCopiedObjectsAsSelectionGroupCommand = new AddSelectionGroupCommand(this._store, this, this._store.state.copiedObjects);

    this._store.history.executeCommand(new BatchCommand(this._store, this, [removeCurrentSelectionGroupCommand, ...addCopiedObjectsCommands, addCopiedObjectsAsSelectionGroupCommand]));
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handleMoveUp() {
    const max = this._store.allObjects.length + 1;
    const increaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      if (obj.zIndex === max) {
        return;
      }

      return new UpdateObjectCommand(this._store, this, obj, { zIndex: obj.zIndex + 1 });
    });

    this._store.history.executeCommand(new BatchCommand(this._store, this, increaseZIndexCommands));
  }

  private handleMoveDown() {
    const min = 0;
    const decreaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      if (obj.zIndex === min) {
        return;
      }

      return new UpdateObjectCommand(this._store, this, obj, { zIndex: obj.zIndex - 1 });
    });

    this._store.history.executeCommand(new BatchCommand(this._store, this, decreaseZIndexCommands));
  }

  private handleMoveToTop() {
    const max = this._store.allObjects.length + 1;
    const increaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: max });
    });

    this._store.history.executeCommand(new BatchCommand(this._store, this, increaseZIndexCommands));
  }

  private handleMoveToBottom() {
    const min = -1;
    const decreaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: min });
    });

    this._store.history.executeCommand(new BatchCommand(this._store, this, decreaseZIndexCommands));
  }
}
