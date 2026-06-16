import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'kritzel-zoom-panel',
  styleUrl: 'kritzel-zoom-panel.css',
  shadow: true,
})
export class KritzelZoomPanel {
  /** Whether the zoom panel is visible. */
  @Prop() visible: boolean = true;

  /** Whether both zoom buttons are disabled. */
  @Prop() disabled: boolean = false;

  /** Emitted when the zoom-in button is clicked. */
  @Event() zoomIn!: EventEmitter<void>;

  /** Emitted when the zoom-out button is clicked. */
  @Event() zoomOut!: EventEmitter<void>;

  private handleZoomIn = (): void => {
    if (!this.disabled) {
      this.zoomIn.emit();
    }
  };

  private handleZoomOut = (): void => {
    if (!this.disabled) {
      this.zoomOut.emit();
    }
  };

  render() {
    return (
      <Host>
        <div class={{ panel: true, visible: this.visible }}>
          <button class="zoom-button" type="button" aria-label="Zoom in" disabled={this.disabled} onClick={this.handleZoomIn}>
            <kritzel-icon name="plus"></kritzel-icon>
          </button>
          <button class="zoom-button" type="button" aria-label="Zoom out" disabled={this.disabled} onClick={this.handleZoomOut}>
            <kritzel-icon name="minus"></kritzel-icon>
          </button>
        </div>
      </Host>
    );
  }
}
