import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { KritzelTermKey } from '@kritzel/engine';

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

  /** Current zoom level in percent. */
  @Prop() zoomPercent: number = 100;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

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

  private get normalizedZoomPercent(): number {
    return Number.isFinite(this.zoomPercent) ? Math.max(1, Math.round(this.zoomPercent)) : 100;
  }

  render() {
    return (
      <Host>
        <div class={{ panel: true, visible: this.visible }}>
          <button class="zoom-button" type="button" aria-label={this.terms['zoom.zoomOut'] ?? 'Zoom out'} disabled={this.disabled} onClick={this.handleZoomOut}>
            <kritzel-icon name="minus"></kritzel-icon>
          </button>
          <span class="zoom-level" aria-live="polite">{this.normalizedZoomPercent}%</span>
          <button class="zoom-button" type="button" aria-label={this.terms['zoom.zoomIn'] ?? 'Zoom in'} disabled={this.disabled} onClick={this.handleZoomIn}>
            <kritzel-icon name="plus"></kritzel-icon>
          </button>
        </div>
      </Host>
    );
  }
}
