import { Component, Host, Prop, h, Event, EventEmitter, State, Watch } from '@stencil/core';
import { ConfigurableTool, getToolConfig, ToolConfigDefinition } from '../../../interfaces/tool-config.interface';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { ShapeFillType } from '../../shared/kritzel-shape-fill/kritzel-shape-fill';
import { LineArrowConfig } from '../../../interfaces/arrow-head.interface';

@Component({
  tag: 'kritzel-tool-config',
  styleUrl: 'kritzel-tool-config.css',
  shadow: true,
})
export class KritzelToolConfig {
  @Prop({ mutable: true }) tool: ConfigurableTool;
  @Watch('tool')
  handleToolChange(newTool: ConfigurableTool) {
    this.config = getToolConfig(newTool);
    this.updatePalette();
  }

  @Prop({ mutable: true }) isExpanded: boolean = false;

  @Event() toolChange: EventEmitter<ConfigurableTool>;

  @State() config: ToolConfigDefinition;
  @State() palette: string[] = [];

  componentWillLoad() {
    this.config = getToolConfig(this.tool);
    this.updatePalette();
  }

  private updatePalette() {
    if (this.config.paletteSource === 'palettes') {
      // Brush tool has palettes[type]
      const brushTool = this.tool as KritzelBrushTool;
      this.palette = brushTool.palettes[brushTool.type] || [];
    } else if (this.config.paletteSource === 'palette') {
      // Line, Shape, Text tools have palette
      this.palette = (this.tool as any).palette || [];
    }
  }

  private handleToggleExpand = () => {
    this.isExpanded = !this.isExpanded;
  };

  private handleColorChange = (event: CustomEvent<string>) => {
    (this.tool as any)[this.config.colorProperty] = event.detail;
    this.toolChange.emit(this.tool);
  };

  private handleSizeChange = (event: CustomEvent<number>) => {
    (this.tool as any)[this.config.sizeProperty] = event.detail;
    this.toolChange.emit(this.tool);
  };

  private handleOpacityChange = (event: CustomEvent<number>) => {
    (this.tool as any)[this.config.opacityProperty] = event.detail;
    this.toolChange.emit(this.tool);
  };

  private handlePropertyChange = (propertyName: string, value: any) => {
    // Special handling for shape fill
    if (this.config.type === 'shape' && propertyName === 'fillColor') {
      (this.tool as any).fillColor = value === 'filled' ? (this.tool as any).strokeColor : 'transparent';
    }
    // Special handling for brush type change
    else if (this.config.type === 'brush' && propertyName === 'type') {
      const brushTool = this.tool as KritzelBrushTool;
      brushTool.type = value;
      this.palette = brushTool.palettes[value];
      brushTool.color = this.palette[0];
    } else {
      (this.tool as any)[propertyName] = value;
    }
    this.toolChange.emit(this.tool);
  };

  private getShapeFillValue(): ShapeFillType {
    const fillColor = (this.tool as any).fillColor;
    return fillColor === 'transparent' ? 'transparent' : 'filled';
  }

  private renderControl(control) {
    const value = (this.tool as any)[control.propertyName];

    switch (control.type) {
      case 'stroke-size':
        return (
          <kritzel-stroke-size
            key={control.type}
            selectedSize={value}
            onSizeChange={this.handleSizeChange}
          ></kritzel-stroke-size>
        );

      case 'font-size':
        return (
          <kritzel-font-size
            key={control.type}
            selectedSize={value}
            fontFamily={(this.tool as any).fontFamily}
            onSizeChange={this.handleSizeChange}
          ></kritzel-font-size>
        );

      case 'line-endings':
        return (
          <kritzel-line-endings
            key={control.type}
            value={value}
            strokeColor={(this.tool as any)[this.config.colorProperty]}
            onValueChange={(event: CustomEvent<LineArrowConfig>) =>
              this.handlePropertyChange(control.propertyName, event.detail)
            }
          ></kritzel-line-endings>
        );

      case 'shape-fill':
        return (
          <kritzel-shape-fill
            key={control.type}
            value={this.getShapeFillValue()}
            onValueChange={(event: CustomEvent<ShapeFillType>) =>
              this.handlePropertyChange(control.propertyName, event.detail)
            }
          ></kritzel-shape-fill>
        );

      case 'font-family':
        return (
          <kritzel-font-family
            key={control.type}
            selectedFontFamily={value}
            onFontFamilyChange={(event: CustomEvent<string>) =>
              this.handlePropertyChange(control.propertyName, event.detail)
            }
          ></kritzel-font-family>
        );

      default:
        return null;
    }
  }

  render() {
    if (!this.config) return null;

    const shouldShowExpandButton = this.palette.length > 6 || this.config.type === 'text';
    
    // Separate size control from other controls
    const sizeControl = this.config.controls.find(c => c.type === 'stroke-size' || c.type === 'font-size');
    const otherControls = this.config.controls.filter(c => c.type !== 'stroke-size' && c.type !== 'font-size');

    return (
      <Host>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            width: '100%',
          }}
        >
          {/* Left column: controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flex: '1',
            }}
          >
            {/* General controls */}
            <kritzel-color-palette
              colors={this.palette}
              selectedColor={(this.tool as any)[this.config.colorProperty]}
              isExpanded={this.isExpanded}
              isOpaque={true}
              onColorChange={this.handleColorChange}
            ></kritzel-color-palette>

            {sizeControl && this.renderControl(sizeControl)}

            <kritzel-opacity-slider
              value={(this.tool as any)[this.config.opacityProperty]}
              previewColor={(this.tool as any)[this.config.colorProperty]}
              onValueChange={this.handleOpacityChange}
            ></kritzel-opacity-slider>

            {/* Divider between general and tool-specific controls */}
            {otherControls.length > 0 && <div class="divider"></div>}

            {/* Tool-specific controls */}
            {otherControls.map(control => this.renderControl(control))}
          </div>

          {/* Right column: expand button */}
          {shouldShowExpandButton && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <button
                class="expand-toggle"
                onClick={this.handleToggleExpand}
                title={this.isExpanded ? 'Collapse' : 'Expand'}
              >
                <kritzel-icon name={this.isExpanded ? 'chevron-up' : 'chevron-down'}></kritzel-icon>
              </button>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
