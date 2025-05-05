import { Component, Host, h, Prop, EventEmitter, Event, State } from '@stencil/core';

@Component({
  tag: 'kritzel-color-palette',
  styleUrl: 'kritzel-color-palette.css',
  shadow: true,
})
export class KritzelColorPalette {
  @Prop()
  colors: string[] = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#808080',
    '#C0C0C0',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
  ];

  @Prop({ mutable: true })
  selectedColor: string | null = null;

  @State() 
  isExpanded: boolean = false;

  @Event() 
  colorChange: EventEmitter<string>;

  private handleColorClick(color: string) {
    this.selectedColor = color;
    this.colorChange.emit(color);
  }

  private toggleExpand = () => {
    this.isExpanded = !this.isExpanded;
  };

  render() {
    const displayedColors = this.isExpanded ? this.colors : this.colors.slice(0, 6);

    return (
      <Host>
        <div class="color-grid">
          {displayedColors.map(color => (
            <div
              class={{
                'color-container': true,
                'selected': this.selectedColor === color,
              }}
              onClick={() => this.handleColorClick(color)}
            >
                <div
                class={{
                  'color-circle': true,
                  'white': color === '#FFFFFF' || color.toLowerCase() === 'white',
                }}
                style={{ backgroundColor: color }}
                ></div>
            </div>
          ))}
        </div>

        <button class="expand-toggle" onClick={this.toggleExpand} title={this.isExpanded ? 'Collapse' : 'Expand'}>
          <kritzel-icon name={this.isExpanded ? 'chevron-up' : 'chevron-down'}></kritzel-icon>
        </button>
      </Host>
    );
  }
}
