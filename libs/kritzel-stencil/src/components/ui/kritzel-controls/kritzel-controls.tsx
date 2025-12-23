import { Component, h, Prop, State, Element, Host, Listen, Event, EventEmitter, Method } from '@stencil/core';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelToolbarControl, KritzelToolbarSubOption } from '../../../interfaces/toolbar-control.interface';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { KritzelUndoState } from '../../../interfaces/undo-state.interface';

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

  @Event() isControlsReady: EventEmitter<void>;

  @State() firstConfig: ToolConfig | null = null;
  @State() isTooltipVisible: boolean = false;
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();
  @State() selectedSubOptions: Map<string, KritzelToolbarSubOption> = new Map();
  @State() openSubMenuControl: KritzelToolbarControl | null = null;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    const element = event.target as HTMLElement;

    if (!this.kritzelEngine || element.closest('.kritzel-tooltip')) {
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
  }

  @Method()
  async closeTooltip() {
    this.isTooltipVisible = false;
  }

  kritzelEngine: HTMLKritzelEngineElement | null = null;
  tooltipRef: HTMLKritzelTooltipElement | null = null;

  get activeToolAsTextTool() {
    return this.activeControl?.tool as KritzelTextTool;
  }

  get activeToolAsBrushTool() {
    return this.activeControl?.tool as KritzelBrushTool;
  }

  async componentWillLoad() {
    await this.initializeEngine();
    await this.initializeTools();
    this.isControlsReady.emit();
  }

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
                        this.activeControl?.tool instanceof KritzelTextTool;

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
          {this.controls.map(control => {
            if (control.type === 'tool') {
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
            }

            if (control.type === 'config' && control.name === this.firstConfig?.name && this.activeControl) {
              return (
                <div 
                  class={{
                    'kritzel-config-container': true,
                    'visible': hasConfigUI,
                  }}
                  key={control.name}
                >
                  <kritzel-tooltip
                    ref={el => (this.tooltipRef = el)}
                    isVisible={this.isTooltipVisible}
                    anchorElement={this.host.shadowRoot?.querySelector('.kritzel-config-container') as HTMLElement}
                    onTooltipClosed={() => this.handleTooltipClosed()}
                  >
                    <div style={{ width: '294px', height: '100%' }}>
                      {this.activeControl.name === 'brush' && (
                        <kritzel-control-brush-config tool={this.activeToolAsBrushTool} onToolChange={event => this.handleToolChange?.(event)}></kritzel-control-brush-config>
                      )}

                      {this.activeControl.name === 'text' && (
                        <kritzel-control-text-config tool={this.activeToolAsTextTool} onToolChange={event => this.handleToolChange?.(event)}></kritzel-control-text-config>
                      )}
                    </div>
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
                    {this.activeControl.tool instanceof KritzelBrushTool && (
                      <div class="color-container">
                        <kritzel-color
                          value={this.activeToolAsBrushTool?.color}
                          size={this.activeToolAsBrushTool?.size}
                          style={{
                            borderRadius: '50%',
                            border: 'none',
                          }}
                        ></kritzel-color>
                      </div>
                    )}

                    {this.activeControl.tool instanceof KritzelTextTool && (
                      <div class="font-container">
                        <kritzel-font
                          fontFamily={this.activeToolAsTextTool?.fontFamily}
                          size={this.activeToolAsTextTool?.fontSize}
                          color={this.activeToolAsTextTool?.fontColor}
                        ></kritzel-font>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </Host>
    );
  }
}
