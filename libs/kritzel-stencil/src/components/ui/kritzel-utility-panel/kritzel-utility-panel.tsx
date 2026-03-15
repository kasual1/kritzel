import { Component, Host, h, Event, EventEmitter, Prop } from '@stencil/core';
import { KritzelUndoState } from '../../../interfaces/undo-state.interface';

@Component({
  tag: 'kritzel-utility-panel',
  styleUrl: 'kritzel-utility-panel.css',
  shadow: true,
})
export class KritzelUtilityPanel {
  @Prop() undoState: KritzelUndoState = null;

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
        <button class="utility-button" data-testid="utility-undo" disabled={!this.undoState?.canUndo} onClick={event => this.handleUndo(event)}>
          <kritzel-icon name="undo"></kritzel-icon>
        </button>
        <button class="utility-button" data-testid="utility-redo" disabled={!this.undoState?.canRedo} onClick={event => this.handleRedo(event)}>
          <kritzel-icon name="redo"></kritzel-icon>
        </button>

        <div class="utility-separator"></div>

        <button class="utility-button" data-testid="utility-delete" onClick={() => this.delete.emit()}>
          <kritzel-icon name="delete"></kritzel-icon>
        </button>
      </Host>
    );
  }
}
