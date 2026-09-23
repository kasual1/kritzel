import { Component, Host, h, Event, EventEmitter, Prop } from '@stencil/core';
import { KritzelUndoState } from '@kritzel/engine';
import { KritzelTermKey } from '@kritzel/engine';

@Component({
  tag: 'kritzel-utility-panel',
  styleUrl: 'kritzel-utility-panel.css',
  shadow: true,
})
export class KritzelUtilityPanel {
  @Prop() undoState: KritzelUndoState = null;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

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
          <kritzel-icon name="undo"></kritzel-icon>
        </button>
        <button class="utility-button" data-testid="utility-redo" disabled={!this.undoState?.canRedo} onClick={event => this.handleRedo(event)} aria-label={this.terms['utility.redo'] ?? 'Redo'}>
          <kritzel-icon name="redo"></kritzel-icon>
        </button>

        <div class="utility-separator"></div>

        <button class="utility-button" data-testid="utility-delete" onClick={() => this.delete.emit()} aria-label={this.terms['utility.delete'] ?? 'Delete selected items'}>
          <kritzel-icon name="delete"></kritzel-icon>
        </button>
      </Host>
    );
  }
}
