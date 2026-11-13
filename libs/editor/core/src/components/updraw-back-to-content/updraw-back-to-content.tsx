import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-back-to-content',
  styleUrl: 'kritzel-back-to-content.css',
  shadow: true,
})
export class KritzelBackToContent {
  /**
   * Whether the button is visible
   */
  @Prop() visible: boolean = false;

  /**
   * The text to display on the button
   */
  @Prop() text: string = 'Back to content';

  /**
   * Emitted when the button is clicked
   */
  @Event() backToContent!: EventEmitter<void>;

  private handleClick = (): void => {
    this.backToContent.emit();
  };

  render() {
    return (
      <Host>
        <button
          class={{ 'back-to-content-button': true, visible: this.visible }}
          onClick={this.handleClick}
          aria-label={this.text}
        >
          <kritzel-icon name="chevronsLeft"></kritzel-icon>
        </button>
      </Host>
    );
  }
}
