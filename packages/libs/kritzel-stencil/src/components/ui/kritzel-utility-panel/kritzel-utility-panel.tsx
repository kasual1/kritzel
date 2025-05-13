import { Component, Host, h, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-utility-panel',
  styleUrl: 'kritzel-utility-panel.css',
  shadow: true,
})
export class KritzelUtilityPanel {

  @Event()
  undo: EventEmitter<void>;

  @Event()
  redo: EventEmitter<void>;

  @Event()
  delete: EventEmitter<void>;


  render() {
    return (
      <Host>
          <button class="utility-button" onClick={() => this.undo.emit()}>
            <kritzel-icon name="undo"></kritzel-icon>
          </button>
          <button class="utility-button" onClick={() => this.redo.emit()}>
            <kritzel-icon name="redo"></kritzel-icon>
          </button>

          <div class="utility-separator"></div>

          <button class="utility-button">
            <kritzel-icon name="delete" onClick={() => this.delete.emit()}></kritzel-icon>
          </button>
      </Host>
    );
  }
}
