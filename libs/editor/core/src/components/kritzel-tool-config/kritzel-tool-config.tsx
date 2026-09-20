import { Component, Host, Prop, h, Event, EventEmitter, State, Watch } from '@stencil/core';
import { ConfigurableTool, ToolConfigDefinition, ToolDisplayValues } from '@kritzel/engine';
import { KritzelToolConfigHelper } from '@kritzel/engine';
import { KritzelTextTool } from '@kritzel/engine';
import { ShapeFillType } from '../kritzel-shape-fill/kritzel-shape-fill';
import { LineArrowConfig } from '@kritzel/engine';
import { KritzelColorHelper } from '@kritzel/engine';
import { ThemeAwareColor } from '@kritzel/engine';
import { ThemeName } from '@kritzel/engine';
import { KritzelTermKey } from '@kritzel/engine';
import { KritzelFontRegistration } from '@kritzel/engine';
import { FontOption } from '../kritzel-font-family/kritzel-font-family';
import { resolveTextToolAvailableFonts } from '@kritzel/engine';
import { KritzelFontRegistry } from '@kritzel/engine';

@Component({
  tag: 'kritzel-tool-config',
  styleUrl: 'kritzel-tool-config.css',
  shadow: true,
})
export class KritzelToolConfig {
  @Prop({ mutable: true }) tool: ConfigurableTool;
  @Watch('tool')
  handleToolChange(newTool: ConfigurableTool, oldTool: ConfigurableTool) {
    const newConfig = KritzelToolConfigHelper.getToolConfig(newTool);
    
    // Maintain settings when switching between shape tools
    if (oldTool && newTool && newConfig?.type === 'shape') {
      const oldConfig = KritzelToolConfigHelper.getToolConfig(oldTool);
      if (oldConfig?.type === 'shape') {
        // Copy properties that should persist
        const propsToCopy = [
          newConfig.colorProperty,   // strokeColor
          newConfig.sizeProperty,    // strokeWidth
          newConfig.opacityProperty, // opacity
          'fillColor'                // shape specific
        ];

        propsToCopy.forEach(prop => {
          if (prop && (oldTool as any)[prop] !== undefined) {
            (newTool as any)[prop] = (oldTool as any)[prop];
          }
        });
      }
    }

    this.config = newConfig;
    if (this.config) {
      this.updatePalette();
      this.updateSizes();
      this.currentOpacity = (newTool as any)[this.config.opacityProperty] ?? 1;
      
      // Emit the values since they might have been updated from the old tool
      this.emitDisplayValues();
    }
  }

  @Prop({ mutable: true }) isExpanded: boolean = false;
  @Prop() theme: ThemeName;
  @Prop() engine: HTMLElement;
  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  private handleSelectionChangeBound = this.handleSelectionChange.bind(this);

  @Watch('theme')
  onThemeChange() {
    this.emitDisplayValues();
  }

  @Watch('engine')
  handleEngineChange(newEngine: HTMLElement, oldEngine: HTMLElement) {
    if (oldEngine) {
      oldEngine.removeEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
    }
    if (newEngine) {
      newEngine.addEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
    }
  }

  @Event() toolChange: EventEmitter<ConfigurableTool>;
  @Event() displayValuesChange: EventEmitter<ToolDisplayValues>;

  @State() config: ToolConfigDefinition;
  @State() palette: ThemeAwareColor[] = [];
  @State() sizes: number[] = [];
  @State() currentOpacity: number = 1;
  @State() private updateTrigger: number = 0;

  private getFontOptionsFromTool(): FontOption[] | undefined {
    const configuredFonts = resolveTextToolAvailableFonts((this.tool as { availableFonts?: KritzelFontRegistration[] }).availableFonts).map(font => {
      const registeredFont = typeof font === 'string'
        ? {
            family: font,
            label: font,
            cssFontFamily: font,
          }
        : {
            family: font.family,
            label: font.label ?? font.family,
            cssFontFamily: font.cssFontFamily ?? font.family,
          };

      return {
        value: registeredFont.family,
        label: registeredFont.label,
        cssFontFamily: registeredFont.cssFontFamily,
      };
    });

    const mergedFonts = [...configuredFonts];
    const seenFonts = new Set(mergedFonts.map(font => font.value.trim().toLocaleLowerCase()));

    for (const font of KritzelFontRegistry.list()) {
      const normalizedValue = font.family.trim().toLocaleLowerCase();
      if (seenFonts.has(normalizedValue)) {
        continue;
      }

      seenFonts.add(normalizedValue);
      mergedFonts.push({
        value: font.family,
        label: font.label,
        cssFontFamily: font.cssFontFamily,
      });
    }

    return mergedFonts;
  }

  handleSelectionChange() {
    if (this.tool?.toolType === 'selection') {
      this.config = KritzelToolConfigHelper.getToolConfig(this.tool);
      if (this.config) {
        this.updatePalette();
        this.updateSizes();
        this.currentOpacity = (this.tool as any)[this.config.opacityProperty] ?? 1;
        this.emitDisplayValues();
      }
    }
  }

  disconnectedCallback() {
    if (this.engine) {
      this.engine.removeEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
    }
  }

  componentWillLoad() {
    this.config = KritzelToolConfigHelper.getToolConfig(this.tool);
    if (this.config) {
      this.updatePalette();
      this.updateSizes();
      this.currentOpacity = (this.tool as any)[this.config.opacityProperty] ?? 1;
      this.emitDisplayValues();
    }
    if (this.engine) {
      this.engine.addEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
    }
  }

  private emitDisplayValues() {
    if (!this.config) return;

    const color = (this.tool as any)[this.config.colorProperty];
    const opacity = this.currentOpacity;
    const size = (this.tool as any)[this.config.sizeProperty];

    const displayValues: ToolDisplayValues = {
      color: KritzelColorHelper.applyOpacity(color, opacity, this.theme),
      size,
    };

    if (this.tool.toolType === 'text') {
      displayValues.fontFamily = (this.tool as KritzelTextTool).fontFamily;
    }

    this.displayValuesChange.emit(displayValues);
  }

  private updatePalette() {
    if (!this.config) return;
    
    if (this.config.paletteSource === 'none') {
      this.palette = [];
    } else {
      this.palette = (this.tool as any).palette || [];
    }
  }

  private updateSizes() {
    if (!this.config) return;

    if (this.config.sizesSource === 'none') {
      this.sizes = [];
    } else {
      this.sizes = (this.tool as any).sizes || [];
    }
  }

  private handleToggleExpand = () => {
    this.isExpanded = !this.isExpanded;
  };

  private handleColorChange = (event: CustomEvent<ThemeAwareColor>) => {
    (this.tool as any)[this.config.colorProperty] = event.detail;

    // Special handling for shape fill: when color (stroke) changes, update fill color if it's currently filled
    if (this.config.type === 'shape' || this.config.type === 'selection') {
      const tool = this.tool as any;
      const isTransparent = typeof tool.fillColor === 'string' ? tool.fillColor === 'transparent' : 
        (tool.fillColor.light === 'transparent' && tool.fillColor.dark === 'transparent');
      if (!isTransparent) {
        tool.fillColor = event.detail;
      }
    }

    this.emitDisplayValues();
    this.toolChange.emit(this.tool);
    this.updateTrigger++;
  };

  private handleSizeChange = (event: CustomEvent<number>) => {
    (this.tool as any)[this.config.sizeProperty] = event.detail;
    this.emitDisplayValues();
    this.toolChange.emit(this.tool);
    this.updateTrigger++;
  };

  private handleOpacityChange = (event: CustomEvent<number>) => {
    (this.tool as any)[this.config.opacityProperty] = event.detail;
    this.currentOpacity = event.detail;
    this.emitDisplayValues();
    this.toolChange.emit(this.tool);
  };

  private handlePropertyChange = (propertyName: string, value: any) => {
    // Special handling for shape fill
    if ((this.config.type === 'shape' || this.config.type === 'selection') && propertyName === 'fillColor') {
      const newFillColor = value === 'filled' ? (this.tool as any)[this.config.colorProperty] : { light: 'transparent', dark: 'transparent' };
      (this.tool as any).fillColor = newFillColor;
      // When switching to fill mode, also update stroke color to match
      if (value === 'filled') {
        (this.tool as any)[this.config.colorProperty] = newFillColor;
      }
    } else {
      (this.tool as any)[propertyName] = value;
      // Emit display values for font family changes
      if (propertyName === 'fontFamily') {
        this.emitDisplayValues();
      }
    }
    this.toolChange.emit(this.tool);
    this.updateTrigger++;
  };

  private getShapeFillValue(): ShapeFillType {
    const fillColor = (this.tool as any).fillColor;
    const isTransparent = typeof fillColor === 'string' ? fillColor === 'transparent' : 
      (fillColor.light === 'transparent' && fillColor.dark === 'transparent');
    return isTransparent ? 'transparent' : 'filled';
  }

  private renderControl(control) {
    const value = (this.tool as any)[control.propertyName];

    switch (control.type) {
      case 'stroke-size':
        return (
          <kritzel-stroke-size
            key={control.type}
            sizes={this.sizes}
            selectedSize={value}
            onSizeChange={this.handleSizeChange}
          ></kritzel-stroke-size>
        );

      case 'font-size':
        return (
          <kritzel-font-size
            key={control.type}
            sizes={this.sizes}
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
            fontOptions={this.getFontOptionsFromTool()}
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
    const shouldShowColorPalette = this.palette.length > 0;
    
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
              gap: '12px',
              flex: '1',
            }}
          >
            {/* Color palette - only show when colors are available */}
            {shouldShowColorPalette && (
              <kritzel-color-palette
                colors={this.palette}
                selectedColor={(this.tool as any)[this.config.colorProperty]}
                isExpanded={this.isExpanded}
                isOpaque={true}
                opacity={this.currentOpacity}
                theme={this.theme}
                onColorChange={this.handleColorChange}
              ></kritzel-color-palette>
            )}

            {sizeControl && this.renderControl(sizeControl)}

            <kritzel-opacity-slider
              value={(this.tool as any)[this.config.opacityProperty]}
              previewColor={(this.tool as any)[this.config.colorProperty]}
              onValueChange={this.handleOpacityChange}
            ></kritzel-opacity-slider>

            {/* Tool-specific controls with dividers */}
            {otherControls.map((control) => [
              <div class="divider"></div>,
              this.renderControl(control),
            ])}
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
                title={this.isExpanded ? (this.terms['toolConfig.collapse'] ?? 'Collapse') : (this.terms['toolConfig.expand'] ?? 'Expand')}
              >
                <kritzel-icon name={this.isExpanded ? 'chevronUp' : 'chevronDown'}></kritzel-icon>
              </button>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
