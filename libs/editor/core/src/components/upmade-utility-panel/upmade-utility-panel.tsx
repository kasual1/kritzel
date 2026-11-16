import { Component, Host, h, Event, EventEmitter, Prop } from '@stencil/core';
import { UpmadeUndoState } from '@upmade/core';
import { UpmadeTermKey } from '@upmade/core';

@Component({
  tag: 'upmade-utility-panel',
  styleUrl: 'upmade-utility-panel.css',
  shadow: true,
})
export class UpmadeUtilityPanel {
  @Prop() undoState: UpmadeUndoState = null;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpmadeTermKey, string>> = {};

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
          <upmade-icon name="undo"></upmade-icon>
        </button>
        <button class="utility-button" data-testid="utility-redo" disabled={!this.undoState?.canRedo} onClick={event => this.handleRedo(event)} aria-label={this.terms['utility.redo'] ?? 'Redo'}>
          <upmade-icon name="redo"></upmade-icon>
        </button>

        <div class="utility-separator"></div>

        <button class="utility-button" data-testid="utility-delete" onClick={() => this.delete.emit()} aria-label={this.terms['utility.delete'] ?? 'Delete selected items'}>
          <upmade-icon name="delete"></upmade-icon>
        </button>
      </Host>
    );
  }
}
