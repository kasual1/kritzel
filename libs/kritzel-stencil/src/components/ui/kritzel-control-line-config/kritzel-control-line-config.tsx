import { Component, Host, Prop, h, Event, EventEmitter, State, Watch } from '@stencil/core';
import { KritzelLineTool } from '../../../classes/tools/line-tool.class';
import { LineArrowConfig } from '../../../interfaces/arrow-head.interface';

@Component({
  tag: 'kritzel-control-line-config',
  styleUrl: 'kritzel-control-line-config.css',
  shadow: true,
})
export class KritzelControlLineConfig {
  @Prop({ mutable: true }) tool: KritzelLineTool;
  @Watch('tool')
  handleToolChange(newTool: KritzelLineTool) {
    this.palette = newTool.palette;
  }

  @Prop({ mutable: true }) isExpanded: boolean = false;

  @Event() toolChange: EventEmitter<KritzelLineTool>;

  @State() palette: string[] = [];

  componentWillLoad() {
    this.palette = this.tool.palette;
  }

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

  handleArrowsChange(event: CustomEvent<LineArrowConfig>) {
    this.tool.arrows = event.detail;
    this.toolChange.emit(this.tool);
  }

  handleOpacityChange(event: CustomEvent<number>) {
    this.tool.opacity = event.detail;
    this.toolChange.emit(this.tool);
  }

  render() {
    return (
      <Host>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: this.isExpanded ? 'flex-start' : 'center',
            justifyContent: 'flex-start',
            width: '100%',
            gap: '8px',
          }}
        >
          <kritzel-color-palette
            colors={this.palette}
            selectedColor={this.tool.color}
            isExpanded={this.isExpanded}
            isOpaque={true}
            onColorChange={event => this.handleColorChange(event)}
          ></kritzel-color-palette>

          {this.palette.length > 6 && (
            <button
              class="expand-toggle"
              onClick={() => this.handleToggleExpand()}
              title={this.isExpanded ? 'Collapse' : 'Expand'}
            >
              <kritzel-icon name={this.isExpanded ? 'chevron-up' : 'chevron-down'}></kritzel-icon>
            </button>
          )}
        </div>

        <kritzel-stroke-size
          selectedSize={this.tool.size}
          onSizeChange={event => this.handleSizeChange(event)}
        ></kritzel-stroke-size>

        <kritzel-line-endings
          value={this.tool.arrows}
          strokeColor={this.tool.color}
          onValueChange={event => this.handleArrowsChange(event)}
        ></kritzel-line-endings>

        <kritzel-opacity-slider
          value={this.tool.opacity}
          previewColor={this.tool.color}
          onValueChange={event => this.handleOpacityChange(event)}
        ></kritzel-opacity-slider>
      </Host>
    );
  }
}
