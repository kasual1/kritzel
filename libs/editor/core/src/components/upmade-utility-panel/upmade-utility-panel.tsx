import { Component, Host, h, Event, EventEmitter, Prop } from '@stencil/core';
import { UpdrawUndoState } from '@updraw/core';
import { UpdrawTermKey } from '@updraw/core';

@Component({
  tag: 'updraw-utility-panel',
  styleUrl: 'updraw-utility-panel.css',
  shadow: true,
})
export class UpdrawUtilityPanel {
  @Prop() undoState: UpdrawUndoState = null;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpdrawTermKey, string>> = {};

  @Event() undo: EventEmitter<void>;
  @Event() redo: EventEmitter<void>;
  @Event() delete: EventEmitter<void>;

  handleUndo(event: Event) {
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
      this.undo.emit();
    }
  }

  handleRedo(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.redo.emit();
  }

  render() {
    return (
      <Host>
        <button class="utility-button" data-testid="utility-undo" disabled={!this.undoState?.canUndo} onClick={event => this.handleUndo(event)} aria-label={this.terms['utility.undo'] ?? 'Undo'}>
          <updraw-icon name="undo"></updraw-icon>
        </button>
        <button class="utility-button" data-testid="utility-redo" disabled={!this.undoState?.canRedo} onClick={event => this.handleRedo(event)} aria-label={this.terms['utility.redo'] ?? 'Redo'}>
          <updraw-icon name="redo"></updraw-icon>
        </button>

        <div class="utility-separator"></div>

        <button class="utility-button" data-testid="utility-delete" onClick={() => this.delete.emit()} aria-label={this.terms['utility.delete'] ?? 'Delete selected items'}>
          <updraw-icon name="delete"></updraw-icon>
        </button>
      </Host>
    );
  }
}
