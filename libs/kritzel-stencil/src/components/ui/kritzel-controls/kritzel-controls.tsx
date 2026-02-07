import { Component, h, Prop, State, Element, Host, Listen, Event, EventEmitter, Method, Watch } from '@stencil/core';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelLineTool } from '../../../classes/tools/line-tool.class';
import { KritzelShapeTool } from '../../../classes/tools/shape-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelToolbarControl, KritzelToolbarSubOption } from '../../../interfaces/toolbar-control.interface';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelUndoState } from '../../../interfaces/undo-state.interface';
import { ToolDisplayValues } from '../../../interfaces/tool-config.interface';
import { KritzelToolConfigHelper } from '../../../helpers/tool-config.helper';
import { KritzelColorHelper } from '../../../helpers/color.helper';
import { ThemeMode } from '../../../constants/color-palette.constants';

type ToolConfig = Record<string, any>;

@Component({
  tag: 'kritzel-controls',
  styleUrl: 'kritzel-controls.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelControls {
  @Element() host!: HTMLElement;

  @Prop() controls: KritzelToolbarControl[] = [];
  @Prop({ mutable: true }) activeControl: KritzelToolbarControl | null = null;
  @Prop() isUtilityPanelVisible: boolean = true;
  @Prop() undoState: KritzelUndoState = null;
  @Prop() theme: ThemeMode;

  @Event() isControlsReady: EventEmitter<void>;

  @State() firstConfig: ToolConfig | null = null;
  @State() isTooltipVisible: boolean = false;
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();
  @State() selectedSubOptions: Map<string, KritzelToolbarSubOption> = new Map();
  @State() openSubMenuControl: KritzelToolbarControl | null = null;
  @State() canScrollLeft: boolean = false;
  @State() canScrollRight: boolean = false;
  @State() needsScrolling: boolean = false;
  @State() displayValues: ToolDisplayValues | null = null;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    if (!this.kritzelEngine) {
      return;
    }

    // Use composedPath to check if click is inside tooltip (works across shadow DOM boundaries)
    const path = event.composedPath();
    const isInsideTooltip = path.some(el => {
      const element = el as HTMLElement;
      if (element.tagName) {
        return element.tagName.toLowerCase() === 'kritzel-tooltip' || element.classList?.contains('kritzel-tooltip');
      }
      return false;
    });

    if (isInsideTooltip) {
      return;
    }

    this.isTooltipVisible = false;
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeTooltip();
      this.openSubMenuControl = null;
      this.kritzelEngine?.enable();
    }
  }

  @Listen('activeToolChange', { target: 'document' })
  async handleActiveToolChange(event: CustomEvent) {
    this.activeControl = this.controls.find(control => control.tool === event.detail) || null;
    if (this.activeControl?.tool) {
      this.updateDisplayValues(this.activeControl.tool as KritzelBaseTool);
    }
  }

  @Listen('objectsSelectionChange', { target: 'document' })
  handleSelectionChange() {
    if (this.activeControl?.tool instanceof KritzelSelectionTool) {
      this.updateDisplayValues(this.activeControl.tool);
    }
  }

  @Watch('theme')
  onThemeChange() {
    if (this.activeControl?.tool) {
      this.updateDisplayValues(this.activeControl.tool as KritzelBaseTool);
    }
  }

  @Method()
  async closeTooltip() {
    this.isTooltipVisible = false;
  }

  kritzelEngine: HTMLKritzelEngineElement | null = null;
  tooltipRef: HTMLKritzelTooltipElement | null = null;
  toolsScrollRef: HTMLDivElement | null = null;

  get activeToolAsTextTool() {
    return this.activeControl?.tool as KritzelTextTool;
  }

  get activeToolAsBrushTool() {
    return this.activeControl?.tool as KritzelBrushTool;
  }

  get activeToolAsLineTool() {
    return this.activeControl?.tool as KritzelLineTool;
  }

  get activeToolAsShapeTool() {
    return this.activeControl?.tool as KritzelShapeTool;
  }

  private handleDisplayValuesChange = (event: CustomEvent<ToolDisplayValues>) => {
    const newVal = event.detail;
    if (
      this.displayValues &&
      this.displayValues.color === newVal.color &&
      this.displayValues.size === newVal.size &&
      this.displayValues.fontFamily === newVal.fontFamily
    ) {
      return;
    }
    this.displayValues = newVal;
  };

  private updateDisplayValues(tool: KritzelBaseTool) {
    const config = KritzelToolConfigHelper.getToolConfig(tool as any);
    if (!config) {
      this.displayValues = null;
      return;
    }

    const color = (tool as any)[config.colorProperty];
    const resolvedColor = KritzelColorHelper.resolveThemeColor(color, this.theme);
    const opacity = (tool as any)[config.opacityProperty] ?? 1;
    const size = (tool as any)[config.sizeProperty];

    const displayValues: ToolDisplayValues = {
      color: KritzelColorHelper.applyOpacity(resolvedColor, opacity),
      size,
    };

    if (tool instanceof KritzelTextTool) {
      displayValues.fontFamily = tool.fontFamily;
    }

    // Check for equality implementation to prevent unnecessary re-renders
    if (
      this.displayValues &&
      this.displayValues.color === displayValues.color &&
      this.displayValues.size === displayValues.size &&
      this.displayValues.fontFamily === displayValues.fontFamily
    ) {
      return;
    }

    this.displayValues = displayValues;
  }

  async componentWillLoad() {
    await this.initializeEngine();
    await this.initializeTools();
    this.isControlsReady.emit();
  }

  componentDidLoad() {
    this.updateScrollIndicators();
  }

  private updateScrollIndicators() {
    if (!this.toolsScrollRef) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = this.toolsScrollRef;
    const threshold = 2; // Small threshold to account for rounding
    
    this.canScrollLeft = scrollLeft > threshold;
    this.canScrollRight = scrollLeft + clientWidth < scrollWidth - threshold;
    this.needsScrolling = scrollWidth > clientWidth;
  }

  private handleToolsScroll = () => {
    this.updateScrollIndicators();
  };

  private async initializeEngine() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngine) {
      throw new Error('kritzel-engine not found in parent element.');
    }
  }

  private async initializeTools() {
    for (const c of this.controls) {
      if (c.type === 'tool' && c.tool) {
        c.tool = await this.kritzelEngine.registerTool(c.name, c.tool, c.config);
      }

      if (c.type === 'tool' && c.isDefault && c.tool) {
        await this.kritzelEngine.changeActiveTool(c.tool as KritzelBaseTool);
        this.activeControl = c;
        this.updateDisplayValues(c.tool as KritzelBaseTool);
      }

      if (c.type === 'config') {
        if (this.firstConfig === null) {
          this.firstConfig = c;
        } else {
          console.warn('Only one config control is allowed. The first one will be used.');
        }
      }
    }
  }

  private async handleControlClick(control: KritzelToolbarControl) {
    this.activeControl = control;

    if (this.activeControl.type === 'tool') {
      this.updateDisplayValues(this.activeControl.tool as KritzelBaseTool);
      await this.kritzelEngine.changeActiveTool(this.activeControl.tool as KritzelBaseTool);
    }
  }

  private handleConfigClick(event: MouseEvent) {
    event.stopPropagation();
    this.isTooltipVisible = !this.isTooltipVisible;
    if(this.isTooltipVisible){
      this.kritzelEngine?.disable();
    } else {
      this.kritzelEngine?.enable();
    }

    setTimeout(() => {
      this.tooltipRef?.focusContent();
    }, 100);
  }

  private async handleToolChange(event: CustomEvent) {
    this.activeControl = { ...this.activeControl, tool: event.detail };
    await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);
  }

  private handleTooltipClosed() {
    this.isTooltipVisible = false;
    this.kritzelEngine?.enable();
  }

  /**
   * Get the currently selected sub-option for a control.
   * Returns the first sub-option as default if none is selected.
   */
  private getSelectedSubOption(control: KritzelToolbarControl): KritzelToolbarSubOption | undefined {
    if (!control.subOptions?.length) return undefined;
    return this.selectedSubOptions.get(control.name) || control.subOptions[0];
  }

  /**
   * Toggle the submenu for a split-button control
   */
  private toggleSubMenu(event: MouseEvent, control: KritzelToolbarControl) {
    event.stopPropagation();
    if (this.openSubMenuControl?.name === control.name) {
      this.openSubMenuControl = null;
    } else {
      this.openSubMenuControl = control;
    }
  }

  /**
   * Select a sub-option and update the tool property
   */
  private async selectSubOption(control: KritzelToolbarControl, option: KritzelToolbarSubOption) {
    // Update the selected sub-options map (create new Map for reactivity)
    const newMap = new Map(this.selectedSubOptions);
    newMap.set(control.name, option);
    this.selectedSubOptions = newMap;

    // Update the tool property if the tool is instantiated
    if (control.tool && typeof control.tool !== 'function') {
      (control.tool as any)[option.toolProperty] = option.value;
    }

    // Close the submenu
    this.openSubMenuControl = null;

    // Activate this control
    await this.handleControlClick(control);
  }

  render() {
    const hasConfigUI = this.activeControl?.tool instanceof KritzelBrushTool || 
                        this.activeControl?.tool instanceof KritzelTextTool ||
                        this.activeControl?.tool instanceof KritzelLineTool ||
                        this.activeControl?.tool instanceof KritzelShapeTool ||
                        (this.activeControl?.tool instanceof KritzelSelectionTool && this.activeControl.tool.hasSelection());

    // Separate tool controls from config control
    const toolControls = this.controls.filter(c => c.type === 'tool');
    const configControl = this.controls.find(c => c.type === 'config' && c.name === this.firstConfig?.name);

    return (
      <Host
        class={{
          mobile: this.isTouchDevice,
        }}
      >
        {this.isUtilityPanelVisible && (
          <kritzel-utility-panel
            style={{
              position: 'absolute',
              bottom: '56px',
              left: '12px',
            }}
            undoState={this.undoState}
            onUndo={() => this.kritzelEngine?.undo()}
            onRedo={() => this.kritzelEngine?.redo()}
            onDelete={() => this.kritzelEngine?.delete()}
          ></kritzel-utility-panel>
        )}

        <div class="kritzel-controls">
          {/* Left scroll indicator gradient */}
          <div class={{ 'scroll-indicator-left': true, 'visible': this.canScrollLeft }}></div>
          
          {/* Scrollable tool controls container */}
          <div 
            class="kritzel-tools-scroll"
            ref={el => {
              this.toolsScrollRef = el;
              // Update indicators when ref is set
              if (el) this.updateScrollIndicators();
            }}
            onScroll={this.handleToolsScroll}
          >
            {toolControls.map(control => {
              // Check if this control has sub-options (split-button)
              if (control.subOptions?.length) {
                const selectedSubOption = this.getSelectedSubOption(control);
                const isActive = this.activeControl?.name === control.name;
                const isSubMenuOpen = this.openSubMenuControl?.name === control.name;

                return (
                  <div
                    class={{
                      'kritzel-control-split': true,
                      'selected': isActive,
                    }}
                    key={control.name}
                    ref={el => { if (el) (control as any)._anchorRef = el; }}
                  >
                    <button
                      class="kritzel-control-main"
                      onClick={() => this.handleControlClick(control)}
                      title={selectedSubOption?.label}
                    >
                      <kritzel-icon name={selectedSubOption?.icon || control.icon}></kritzel-icon>
                    </button>
                    <button
                      class={{
                        'kritzel-control-dropdown': true,
                        'visible': isActive,
                      }}
                      onClick={(e) => this.toggleSubMenu(e, control)}
                      aria-label="Select shape type"
                      aria-expanded={isSubMenuOpen ? 'true' : 'false'}
                      tabIndex={isActive ? 0 : -1}
                    >
                      <kritzel-icon name="chevron-down" size={12}></kritzel-icon>
                    </button>

                    <kritzel-tooltip
                      isVisible={isSubMenuOpen}
                      anchorElement={(control as any)._anchorRef}
                      onTooltipClosed={() => { this.openSubMenuControl = null; }}
                    >
                      <div class="kritzel-submenu-content">
                        {control.subOptions.map(option => (
                          <button
                            class={{
                              'kritzel-submenu-item': true,
                              'active': option.id === selectedSubOption?.id,
                            }}
                            key={option.id}
                            onClick={() => this.selectSubOption(control, option)}
                          >
                            <kritzel-icon name={option.icon} size={20}></kritzel-icon>
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </kritzel-tooltip>
                  </div>
                );
              }

              // Regular tool control (no sub-options)
              return (
                <button
                  class={{
                    'kritzel-control': true,
                    'selected': this.activeControl?.name === control?.name,
                  }}
                  key={control.name}
                  onClick={_event => this.handleControlClick?.(control)}
                >
                  <kritzel-icon name={control.icon}></kritzel-icon>
                </button>
              );
            })}
          </div>
          
          {/* Right scroll indicator gradient */}
          <div class={{ 'scroll-indicator-right': true, 'visible': this.canScrollRight && !(configControl && this.activeControl && hasConfigUI) }}></div>

          {/* Config control stays outside the scroll area */}
          {configControl && this.activeControl && (
            <div 
              class={{
                'kritzel-config-container': true,
                'visible': hasConfigUI,
              }}
              key={configControl.name}
            >
              {/* Left gradient on config control */}
              <div class={{ 'config-gradient-left': true, 'visible': this.needsScrolling }}></div>
              
              <kritzel-tooltip
                ref={el => (this.tooltipRef = el)}
                isVisible={this.isTooltipVisible}
                anchorElement={this.host.shadowRoot?.querySelector('.kritzel-config-container') as HTMLElement}
                onTooltipClosed={() => this.handleTooltipClosed()}
              >
                <kritzel-tool-config 
                  tool={this.activeControl.tool as any} 
                  theme={this.theme}
                  onToolChange={event => this.handleToolChange?.(event)}
                  onDisplayValuesChange={this.handleDisplayValuesChange}
                  style={{ width: '100%', height: '100%' }}
                ></kritzel-tool-config>
              </kritzel-tooltip>

              <div
                tabIndex={hasConfigUI ? 0 : -1}
                class="kritzel-config"
                onClick={event => this.handleConfigClick?.(event)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    this.handleConfigClick?.(event as any);
                  }
                }}
                style={{
                  cursor: 'pointer',
                }}
              >
                {this.activeControl.tool instanceof KritzelTextTool && this.displayValues ? (
                  <div class="font-container">
                    <kritzel-font
                      fontFamily={this.displayValues.fontFamily}
                      size={this.displayValues.size}
                      color={this.displayValues.color}
                    ></kritzel-font>
                  </div>
                ) : this.displayValues && (
                  <div class="color-container">
                    <kritzel-color
                      value={this.displayValues.color}
                      theme={this.theme}
                      size={this.displayValues.size}
                      style={{
                        borderRadius: '50%',
                        border: 'none',
                      }}
                    ></kritzel-color>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
