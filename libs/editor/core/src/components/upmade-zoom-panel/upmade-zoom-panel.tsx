import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { UpdrawTermKey } from '@updraw/core';

@Component({
  tag: 'updraw-zoom-panel',
  styleUrl: 'updraw-zoom-panel.css',
  shadow: true,
})
export class UpdrawZoomPanel {
  /** Whether the zoom panel is visible. */
  @Prop() visible: boolean = true;

  /** Whether both zoom buttons are disabled. */
  @Prop() disabled: boolean = false;

  /** Current zoom level in percent. */
  @Prop() zoomPercent: number = 100;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpdrawTermKey, string>> = {};

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
            <updraw-icon name="minus"></updraw-icon>
          </button>
          <span class="zoom-level" aria-live="polite">{this.normalizedZoomPercent}%</span>
          <button class="zoom-button" type="button" aria-label={this.terms['zoom.zoomIn'] ?? 'Zoom in'} disabled={this.disabled} onClick={this.handleZoomIn}>
            <updraw-icon name="plus"></updraw-icon>
          </button>
        </div>
      </Host>
    );
  }
}
