import { Component, Host, Prop, h, Event, EventEmitter, State, Watch } from '@stencil/core';
import { KritzelShapeTool } from '../../../classes/tools/shape-tool.class';
import { ShapeFillType } from '../../shared/kritzel-shape-fill/kritzel-shape-fill';

@Component({
  tag: 'kritzel-control-shape-config',
  styleUrl: 'kritzel-control-shape-config.css',
  shadow: true,
})
export class KritzelControlShapeConfig {
  @Prop({ mutable: true }) tool: KritzelShapeTool;
  @Watch('tool')
  handleToolChange(newTool: KritzelShapeTool) {
    this.palette = newTool.palette;
  }

  @Prop({ mutable: true }) isExpanded: boolean = false;

  @Event() toolChange: EventEmitter<KritzelShapeTool>;

  @State() palette: string[] = [];

  componentWillLoad() {
    this.palette = this.tool.palette;
  }

  handleToggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  handleColorChange(event: CustomEvent<string>) {
    this.tool.strokeColor = event.detail;
    this.toolChange.emit(this.tool);
  }

  handleSizeChange(event: CustomEvent<number>) {
    this.tool.strokeWidth = event.detail;
    this.toolChange.emit(this.tool);
  }

  handleFillChange(event: CustomEvent<ShapeFillType>) {
    this.tool.fillColor = event.detail === 'filled' ? this.tool.strokeColor : 'transparent';
    this.toolChange.emit(this.tool);
  }

  private getFillValue(): ShapeFillType {
    return this.tool.fillColor === 'transparent' ? 'transparent' : 'filled';
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
            selectedColor={this.tool.strokeColor}
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
          selectedSize={this.tool.strokeWidth}
          onSizeChange={event => this.handleSizeChange(event)}
        ></kritzel-stroke-size>

        <kritzel-shape-fill
          value={this.getFillValue()}
          onValueChange={event => this.handleFillChange(event)}
        ></kritzel-shape-fill>
      </Host>
    );
  }
}
