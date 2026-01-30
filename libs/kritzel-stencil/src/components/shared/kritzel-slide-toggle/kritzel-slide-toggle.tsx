import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-slide-toggle',
  styleUrl: 'kritzel-slide-toggle.css',
  shadow: true,
})
export class KritzelSlideToggle {
  /** Whether the toggle is checked/on */
  @Prop({ mutable: true }) checked = false;

  /** Whether the toggle is disabled */
  @Prop() disabled = false;

  /** Label text for accessibility (screen readers) */
  @Prop() label?: string;

  /** Emitted when the toggle state changes */
  @Event() checkedChange: EventEmitter<boolean>;

  private handleToggle = () => {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.handleToggle();
    }
  };

  render() {
    return (
      <Host
        class={{ checked: this.checked, disabled: this.disabled }}
        tabIndex={this.disabled ? -1 : 0}
        role="switch"
        aria-checked={this.checked ? 'true' : 'false'}
        aria-disabled={this.disabled ? 'true' : 'false'}
        aria-label={this.label}
        onClick={this.handleToggle}
        onKeyDown={this.handleKeyDown}
      >
        <div class="toggle-track">
          <div class="toggle-thumb"></div>
        </div>
      </Host>
    );
  }
}
