import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'upmade-button',
  styleUrl: 'upmade-button.css',
  shadow: true,
})
export class UpmadeButton {
  /** The visual variant of the button */
  @Prop() variant: 'primary' | 'secondary' | 'text' = 'primary';

  /** Whether the button is disabled */
  @Prop() disabled = false;

  /** The type attribute for the native button element */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /** Emitted when the button is clicked */
  @Event() buttonClick: EventEmitter<void>;

  private handleClick = (event: MouseEvent) => {
    if (this.disabled) return;
    event.stopPropagation();
    this.buttonClick.emit();
  };

  render() {
    return (
      <Host>
        <button
          type={this.type}
          class={{
            'upmade-button': true,
            [this.variant]: true,
            'disabled': this.disabled,
          }}
          disabled={this.disabled}
          onClick={this.handleClick}
        >
          <slot></slot>
        </button>
      </Host>
    );
  }
}
