import { KritzelStore } from '../../stores/store';
import { AddObjectCommand } from '../commands/add-object.command';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelKeyHandler extends KritzelBaseHandler {
  constructor(store: KritzelStore) {
    super(store);
  }

  handleKeyDown(event: KeyboardEvent): void {
    this._store.state.isCtrlKeyPressed = event.ctrlKey;

    if (event.key === 'Escape') {
      this.handleEscape();
    }

    if (event.key === 'Delete') {
      this.handleDelete();
    }

    if (event.key === 'c' && event.ctrlKey) {
      this.handleCopy();
    }

    if (event.key === 'v' && event.ctrlKey) {
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
    this._store.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
  }

  private handleDelete() {
    const deleteSelectedObjectsCommand = this._store.state.selectionGroup.objects.map(obj => new RemoveObjectCommand(this._store, this._store.state.selectionGroup, obj));
    const removeSelectionGroupCommand = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    const commands = [...deleteSelectedObjectsCommand, removeSelectionGroupCommand];

    this._store.executeCommand(new BatchCommand(this._store, this._store.state.selectionGroup, commands));
  }

  private handleCopy() {
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handlePaste() {
    this._store.state.copiedObjects.selected = true;

    const removeCurrentSelectionGroupCommand = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    const addCopiedObjectsCommands = this._store.state.copiedObjects.objects.map(obj => new AddObjectCommand(this._store, this, obj));
    const addCopiedObjectsAsSelectionGroupCommand = new AddSelectionGroupCommand(this._store, this, this._store.state.copiedObjects);

    this._store.executeCommand(new BatchCommand(this._store, this, [removeCurrentSelectionGroupCommand, ...addCopiedObjectsCommands, addCopiedObjectsAsSelectionGroupCommand]));
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handleMoveUp() {
    const max = this._store.state.objects.length + 1;
    const increaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      if (obj.zIndex === max) {
        return;
      }

      return new UpdateObjectCommand(this._store, this, obj, { zIndex: obj.zIndex + 1 });
    });

    this._store.executeCommand(new BatchCommand(this._store, this, increaseZIndexCommands));
  }

  private handleMoveDown() {
    const min = 0;
    const decreaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      if (obj.zIndex === min) {
        return;
      }

      return new UpdateObjectCommand(this._store, this, obj, { zIndex: obj.zIndex - 1 });
    });

    this._store.executeCommand(new BatchCommand(this._store, this, decreaseZIndexCommands));
  }

  private handleMoveToTop() {
    const max = this._store.state.objects.length + 1;
    const increaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: max });
    });
    
    this._store.executeCommand(new BatchCommand(this._store, this, increaseZIndexCommands));
  }

  private handleMoveToBottom() {
    const min = -1;
    const decreaseZIndexCommands = this._store.state.selectionGroup.objects.map(obj => {
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: min });
    });

    this._store.executeCommand(new BatchCommand(this._store, this, decreaseZIndexCommands));
  }
}
