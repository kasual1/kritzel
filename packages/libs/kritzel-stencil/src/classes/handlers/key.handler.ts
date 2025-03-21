import { KritzelStore } from '../../stores/store';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base-handler';

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
    this._store.state.selectionGroup = null;

    this._store.state.objects = [...this._store.state.objects.filter(o => !(o instanceof KritzelSelectionGroup))];
  }

  private handleDelete() {
    const toBeDeleted = this._store.state.selectionGroup.objects;

    this._store.state.selectionGroup = null;

    this._store.state.objects = [...this._store.state.objects.filter(o => !toBeDeleted.includes(o)).filter(o => !(o instanceof KritzelSelectionGroup))];
  }

  private handleCopy() {
    this._store.state.copiedObject = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handlePaste() {
    this._store.state.selectionGroup = this._store.state.copiedObject;
    this._store.state.selectionGroup.selected = true;
    this._store.state.copiedObject = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;

    this._store.state.objects = [
      ...this._store.state.objects.filter(o => !(o instanceof KritzelSelectionGroup)),
      ...this._store.state.selectionGroup.objects,
      this._store.state.selectionGroup,
    ];

    this._store.state.history.forceCreateSnapshot();
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
