import { Component, Host, Prop, h, Event, EventEmitter } from '@stencil/core';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';

@Component({
  tag: 'kritzel-control-text-config',
  styleUrl: 'kritzel-control-text-config.css',
  shadow: true,
})
export class KritzelControlTextConfig {
  @Prop({mutable: true})
  tool: KritzelTextTool;

  @Prop()
  isExpanded: boolean = false;

  @Event()
  toolChange: EventEmitter<KritzelTextTool>;


  handleToggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  handleFamilyChange(event: CustomEvent<string>) {
    this.tool.fontFamily = event.detail;
    this.toolChange.emit(this.tool);
  }

  handleColorChange(event: CustomEvent<string>) {
    this.tool.fontColor = event.detail;
    this.toolChange.emit(this.tool);
  }

  handleSizeChange(event: CustomEvent<number>) {
    this.tool.fontSize = event.detail;
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
          <kritzel-font-family selectedFontFamily={this.tool.fontFamily} onFontFamilyChange={event => this.handleFamilyChange(event)}></kritzel-font-family>

          <button class="expand-toggle" onClick={() => this.handleToggleExpand()} title={this.isExpanded ? 'Collapse' : 'Expand'}>
            <kritzel-icon name={this.isExpanded ? 'chevron-up' : 'chevron-down'}></kritzel-icon>
          </button>
        </div>

        <kritzel-color-palette selectedColor={this.tool.fontColor} isExpanded={this.isExpanded} onColorChange={event => this.handleColorChange(event)}></kritzel-color-palette>

        <kritzel-font-size selectedSize={this.tool.fontSize} fontFamily={this.tool.fontFamily} onSizeChange={event => this.handleSizeChange(event)}></kritzel-font-size>
      </Host>
    );
  }
}
