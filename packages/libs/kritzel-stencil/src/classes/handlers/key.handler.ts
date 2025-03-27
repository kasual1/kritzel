import { KritzelStore } from '../../stores/store';
import { AddObjectCommand } from '../commands/add-object.command';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
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
    const commands = [
      ...this._store.state.selectionGroup.objects.map(
      obj => new RemoveObjectCommand(this._store, this._store.state.selectionGroup, obj)
      ),
      new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup)
    ];

    this._store.executeCommand(new BatchCommand(this._store, this._store.state.selectionGroup, commands));
  }

  private handleCopy() {
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handlePaste() {
    this._store.state.copiedObjects.selected = true;
    const removeCurrentSelectionGroupCommand = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    const addCopiedObjectsCommands = this._store.state.copiedObjects.objects.map(
      obj => new AddObjectCommand(this._store, this, obj)
    );
    const addCopiedObjectsAsSelectionGroupCommand = new AddSelectionGroupCommand(this._store, this, this._store.state.copiedObjects);
    this._store.executeCommand(new BatchCommand(this._store, this, [removeCurrentSelectionGroupCommand, ...addCopiedObjectsCommands, addCopiedObjectsAsSelectionGroupCommand]));
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handleMoveUp() {
    const max = this._store.state.objects.length;
    this._store.state.selectionGroup?.objects.forEach(obj => {
      if (obj.zIndex === max) {
        return;
      }

      obj.zIndex += 1;
    });

    this._store.rerender();
  }

  private handleMoveDown() {
    const min = 0;
    this._store.state.selectionGroup?.objects.forEach(obj => {
      if (obj.zIndex === min) {
        return;
      }

      obj.zIndex -= 1;
    });

    this._store.rerender();
  }

  private handleMoveToTop() {
    const max = this._store.state.objects.length + 1;
    this._store.state.selectionGroup?.objects.forEach(obj => {
      obj.zIndex = max;
    });

    this._store.rerender();
  }

  private handleMoveToBottom() {
    const min = -1;
    this._store.state.selectionGroup?.objects.forEach(obj => {
      obj.zIndex = min;
    });

    this._store.rerender();
  }
}
