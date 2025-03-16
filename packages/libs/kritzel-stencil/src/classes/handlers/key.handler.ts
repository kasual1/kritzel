import { KritzelSelectionState } from '../../interfaces/selection-state.interface';
import { kritzelEngineState } from '../../stores/engine.store';
import { KritzelHistory } from '../history.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';

export class KritzelKeyHandler {
  selectionState: KritzelSelectionState;

  history: KritzelHistory;

  copiedObject: KritzelSelectionGroup | null = null;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
    this.history = new KritzelHistory();
  }

  handleKeyDown(event: KeyboardEvent): void {
    this.selectionState.isCtrlKeyPressed = event.ctrlKey;

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

    if (event.key === '+' && event.ctrlKey && this.selectionState.selectionGroup) {
      this.handleMoveUp();
    }

    if (event.key === '-' && event.ctrlKey && this.selectionState.selectionGroup) {
      this.handleMoveDown();
    }

    if (event.key === '*' && event.shiftKey && this.selectionState.selectionGroup) {
      this.handleMoveToTop();
    }

    if (event.key === '_' && event.shiftKey && this.selectionState.selectionGroup) {
      this.handleMoveToBottom();
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    this.selectionState.isCtrlKeyPressed = event.ctrlKey;
  }

  private handleEscape() {
    this.selectionState.selectionGroup = null;

    kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KritzelSelectionGroup))];
  }

  private handleDelete() {
    const toBeDeleted = this.selectionState.selectionGroup.objects;

    this.selectionState.selectionGroup = null;

    kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !toBeDeleted.includes(o)).filter(o => !(o instanceof KritzelSelectionGroup))];
  }

  private handleCopy() {
    this.copiedObject = this.selectionState.selectionGroup.copy() as KritzelSelectionGroup;
  }

  private handlePaste() {
    this.selectionState.selectionGroup = this.copiedObject;
    this.selectionState.selectionGroup.selected = true;
    this.copiedObject = this.selectionState.selectionGroup.copy() as KritzelSelectionGroup;

    kritzelEngineState.objects = [
      ...kritzelEngineState.objects.filter(o => !(o instanceof KritzelSelectionGroup)),
      ...this.selectionState.selectionGroup.objects,
      this.selectionState.selectionGroup,
    ];

    this.history.forceCreateSnapshot();
  }

  private handleMoveUp() {
    const max = kritzelEngineState.objects.length;
    this.selectionState.selectionGroup?.objects.forEach(obj => {
      if (obj.zIndex === max) {
        return;
      }

      obj.zIndex += 1;
    });

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private handleMoveDown() {
    const min = 0;
    this.selectionState.selectionGroup?.objects.forEach(obj => {
      if (obj.zIndex === min) {
        return;
      }

      obj.zIndex -= 1;
    });

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private handleMoveToTop() {
    const max = kritzelEngineState.objects.length + 1;
    this.selectionState.selectionGroup?.objects.forEach(obj => {
      obj.zIndex = max;
    });

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private handleMoveToBottom() {
    const min = -1;
    this.selectionState.selectionGroup?.objects.forEach(obj => {
      obj.zIndex = min;
    });

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }
}
