import { Component, Host, Prop, h, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'kritzel-control-brush-config',
  styleUrl: 'kritzel-control-brush-config.css',
  shadow: true,
})
export class KritzelControlBrushConfig {
  @Prop()
  activeControl: string;

  @Prop()
  type: string;

  @Prop()
  color: string;

  @Prop()
  size: number;

  @Prop()
  isExpanded: boolean = false;

  @Event()
  familyChange: EventEmitter<string>;

  @Event()
  colorChange: EventEmitter<string>;

  @Event()
  sizeChange: EventEmitter<number>;

  handleToggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  handleFamilyChange(event: CustomEvent<string>) {
    this.familyChange.emit(event.detail);
  }

  handleColorChange(event: CustomEvent<string>) {
    this.colorChange.emit(event.detail);
  }

  handleSizeChange(event: CustomEvent<number>) {
    this.sizeChange.emit(event.detail);
  }

  render() {
    return (
      <Host>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            gap: '8px',
          }}
        >
          <kritzel-brush-style></kritzel-brush-style>

          <button class="expand-toggle" onClick={() => this.handleToggleExpand()} title={this.isExpanded ? 'Collapse' : 'Expand'}>
            <kritzel-icon name={this.isExpanded ? 'chevron-up' : 'chevron-down'}></kritzel-icon>
          </button>
        </div>

        <kritzel-color-palette selectedColor={this.color} isExpanded={this.isExpanded} onColorChange={color => this.handleColorChange(color)}></kritzel-color-palette>

        <kritzel-stroke-size selectedSize={this.size} onSizeChange={event => this.handleSizeChange(event)}></kritzel-stroke-size>
      </Host>
    );
  }
}
