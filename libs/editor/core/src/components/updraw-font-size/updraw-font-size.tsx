import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'updraw-font-size',
  styleUrl: 'updraw-font-size.css',
  shadow: true,
})
export class UpdrawFontSize {
  @Prop() sizes: number[] = [8, 10, 12, 16, 20, 24];
  @Prop({ mutable: true }) selectedSize: number | null = null;
  @Prop() fontFamily: string = 'Arial';

  @Event() sizeChange: EventEmitter<number>;

  private handleSizeClick(size: number) {
    this.selectedSize = size;
    this.sizeChange.emit(size);
  }

  private handleKeyDown(event: KeyboardEvent, size: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleSizeClick(size);
    }
  }

  render() {
    const color = 'var(--updraw-global-text-primary)';
    const sizes = this.sizes ?? [];

    return (
      <Host>
        {sizes.map(size => (
          <div
            tabIndex={0}
            class={{
              'size-container': true,
              'selected': this.selectedSize === size,
            }}
            onClick={() => this.handleSizeClick(size)}
            onKeyDown={event => this.handleKeyDown(event, size)}
          >
            <updraw-font fontFamily={this.fontFamily} size={size} color={color}></updraw-font>
          </div>
        ))}
      </Host>
    );
  }
}
