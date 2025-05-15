import { Component, Host, Prop, h, Event, EventEmitter } from '@stencil/core';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';

@Component({
  tag: 'kritzel-control-brush-config',
  styleUrl: 'kritzel-control-brush-config.css',
  shadow: true,
})
export class KritzelControlBrushConfig {
  @Prop({mutable: true})
  tool: KritzelBrushTool;

  @Prop()
  isExpanded: boolean = false;

  @Event()
  toolChange: EventEmitter<KritzelBrushTool>;

  handleToggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  handleColorChange(event: CustomEvent<string>) {
    this.tool.color = event.detail;
    this.toolChange.emit(this.tool);
  }

  handleSizeChange(event: CustomEvent<number>) {
    this.tool.size = event.detail;
    this.toolChange.emit(this.tool);
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

        <kritzel-color-palette selectedColor={this.tool.color} isExpanded={this.isExpanded} isOpaque={true} onColorChange={color => this.handleColorChange(color)}></kritzel-color-palette>

        <kritzel-stroke-size selectedSize={this.tool.size} onSizeChange={event => this.handleSizeChange(event)}></kritzel-stroke-size>
      </Host>
    );
  }
}
