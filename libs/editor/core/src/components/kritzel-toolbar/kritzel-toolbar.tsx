import { Component, h, Prop, State, Element, Host, Listen, Event, EventEmitter, Method, Watch } from '@stencil/core';
import { KritzelBrushTool } from '@kritzel/engine';
import { KritzelLineTool } from '@kritzel/engine';
import { KritzelShapeTool } from '@kritzel/engine';
import { KritzelTextTool } from '@kritzel/engine';
import { KritzelToolbarItem, KritzelToolbarSubOption } from '@kritzel/engine';
import { KritzelBaseTool } from '@kritzel/engine';
import { KritzelDevicesHelper } from '@kritzel/engine';
import { KritzelUndoState } from '@kritzel/engine';
import { ToolDisplayValues } from '@kritzel/engine';
import { KritzelToolConfigHelper } from '@kritzel/engine';
import { KritzelColorHelper } from '@kritzel/engine';
import { ThemeName } from '@kritzel/engine';
import { KritzelTermKey } from '@kritzel/engine';

type ToolConfig = Record<string, any>;

@Component({
  tag: 'kritzel-toolbar',
  styleUrl: 'kritzel-toolbar.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelToolbar {
  @Element() host!: HTMLElement;

  @Prop() visible: boolean = true;
  @Prop() toolbarItems: KritzelToolbarItem[] = [];
  @Prop({ mutable: true }) activeControl: KritzelToolbarItem | null = null;
  @Prop() isUtilityPanelVisible: boolean = true;
  @Prop() undoState: KritzelUndoState = null;
  @Prop() theme: ThemeName = 'light';
  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  @Event() isToolbarReady: EventEmitter<void>;

  @State() firstConfig: ToolConfig | null = null;
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();
  @State() selectedSubOptions: Map<string, KritzelToolbarSubOption> = new Map();
  @State() canScrollLeft: boolean = false;
  @State() canScrollRight: boolean = false;
  @State() needsScrolling: boolean = false;
  @State() displayValues: ToolDisplayValues | null = null;

  @State() internalToolbar: KritzelToolbarItem[] = [];
  @State() resolvedDisabled: Map<string, boolean> = new Map();

  private handleActiveToolChangeBound = this.handleActiveToolChange.bind(this);
  private handleSelectionChangeBound = this.handleSelectionChange.bind(this);

  @Listen('keydown', { target: 'window' })
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeTooltip();
      this.kritzelEngine?.enable();
    }
  }

  async handleActiveToolChange(event: CustomEvent) {
    this.activeControl = this.internalToolbar.find(control => control.tool === event.detail) || null;

    if (this.activeControl?.tool) {
      this.updateDisplayValues(this.activeControl.tool as KritzelBaseTool);
    }
    this.closeTooltip();
  }

  handleSelectionChange() {
    const tool = this.activeControl?.tool;
    if (tool && typeof tool !== 'function' && tool.toolType === 'selection') {
      this.updateDisplayValues(tool);
    }
  }

  @Watch('toolbarItems')
  async onToolbarItemsChange() {
    if (this.kritzelEngine) {
      await this.initializeTools();
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
    document.dispatchEvent(new CustomEvent('kritzelTooltipCloseAll'));
  }

  kritzelEngine: HTMLKritzelEngineElement | null = null;
  toolsScrollRef: HTMLDivElement | null = null;
  private configTriggerRef: HTMLElement | null = null;

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
    if (this.displayValues && this.displayValues.color === newVal.color && this.displayValues.size === newVal.size && this.displayValues.fontFamily === newVal.fontFamily) {
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
    const opacity = (tool as any)[config.opacityProperty] ?? 1;
    const size = (tool as any)[config.sizeProperty];

    const displayValues: ToolDisplayValues = {
      color: KritzelColorHelper.applyOpacity(color, opacity, this.theme),
      size,
    };

    if (tool.toolType === 'text') {
      displayValues.fontFamily = (tool as KritzelTextTool).fontFamily;
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
    this.isToolbarReady.emit();
  }

  componentDidLoad() {
    this.updateScrollIndicators();
  }

  componentDidRender() {
    this.updateScrollIndicators();
  }

  disconnectedCallback() {
    if (this.kritzelEngine) {
      this.kritzelEngine.removeEventListener('activeToolChange', this.handleActiveToolChangeBound);
      this.kritzelEngine.removeEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
    }
  }

  private updateScrollIndicators() {
    if (!this.toolsScrollRef) return;

    const { scrollLeft, scrollWidth, clientWidth } = this.toolsScrollRef;
    const threshold = 2; // Small threshold to account for rounding

    const canScrollLeft = scrollLeft > threshold;
    const canScrollRight = scrollLeft + clientWidth < scrollWidth - threshold;
    const needsScrolling = scrollWidth > clientWidth;

    if (this.canScrollLeft !== canScrollLeft) this.canScrollLeft = canScrollLeft;
    if (this.canScrollRight !== canScrollRight) this.canScrollRight = canScrollRight;
    if (this.needsScrolling !== needsScrolling) this.needsScrolling = needsScrolling;
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

    this.kritzelEngine.addEventListener('activeToolChange', this.handleActiveToolChangeBound as EventListener);
    this.kritzelEngine.addEventListener('objectsSelectionChange', this.handleSelectionChangeBound);
  }

  private async initializeTools() {
    let hasDefault = false;
    const newToolbar = this.toolbarItems.map(c => ({ ...c }));

    await this.resolveDisabledStates(newToolbar);

    for (const c of newToolbar) {
      if (c.type === 'tool' && c.tool) {
        const registered = await this.kritzelEngine!.getTool(c.name);
        if (registered) {
          c.tool = registered;
        }
      }

      if (c.type === 'tool' && c.isDefault && !this.isControlDisabled(c) && c.tool) {
        await this.kritzelEngine!.setActiveTool(c.name);
        this.activeControl = c;
        this.updateDisplayValues(c.tool as KritzelBaseTool);
        hasDefault = true;
      }

      if (c.type === 'config') {
        if (this.firstConfig === null) {
          this.firstConfig = c;
        } else {
          console.warn('Only one config control is allowed. The first one will be used.');
        }
      }
    }

    this.internalToolbar = newToolbar;

    // If no tool is marked as default, activate the first tool control
    if (!hasDefault) {
      const firstTool = this.internalToolbar.find(c => c.type === 'tool' && c.tool && !this.isControlDisabled(c));
      if (firstTool) {
        await this.kritzelEngine!.setActiveTool(firstTool.name);
        this.activeControl = firstTool;
        this.updateDisplayValues(firstTool.tool as KritzelBaseTool);
      }
    }
  }

  /**
   * Resolves each tool's `isDisabled` (boolean or sync/async function) into `resolvedDisabled`.
   */
  private async resolveDisabledStates(items: KritzelToolbarItem[]): Promise<void> {
    const entries = await Promise.all(
      items
        .filter(item => item.type === 'tool')
        .map(async item => [item.name, await this.evaluateDisabled(item.isDisabled)] as const),
    );
    this.resolvedDisabled = new Map(entries);
  }

  private async evaluateDisabled(value?: boolean | (() => boolean | Promise<boolean>)): Promise<boolean> {
    if (typeof value === 'function') {
      try {
        return !!(await value());
      } catch {
        return false;
      }
    }
    return !!value;
  }

  private isControlDisabled(control: KritzelToolbarItem): boolean {
    return this.resolvedDisabled.get(control.name) ?? false;
  }

  private async handleControlClick(control: KritzelToolbarItem) {
    if (this.isControlDisabled(control)) {
      return;
    }

    this.activeControl = control;

    if (this.activeControl.type === 'tool') {
      this.updateDisplayValues(this.activeControl.tool as KritzelBaseTool);
      await this.kritzelEngine.setActiveTool(this.activeControl.name);
    }
  }

  private async handleToolChange(event: CustomEvent) {
    this.activeControl = { ...this.activeControl, tool: event.detail };
    await this.kritzelEngine.setActiveTool(this.activeControl.name);
  }

  /**
   * Get the currently selected sub-option for a control.
   * Returns the first sub-option as default if none is selected.
   */
  private getSelectedSubOption(control: KritzelToolbarItem): KritzelToolbarSubOption | undefined {
    if (!control.subOptions?.length) return undefined;
    return this.selectedSubOptions.get(control.name) || control.subOptions[0];
  }

  /**
   * Select a sub-option and update the tool property
   */
  private async selectSubOption(control: KritzelToolbarItem, option: KritzelToolbarSubOption) {
    if (this.isControlDisabled(control)) {
      return;
    }

    // Update the selected sub-options map (create new Map for reactivity)
    const newMap = new Map(this.selectedSubOptions);
    newMap.set(control.name, option);
    this.selectedSubOptions = newMap;

    // Update the tool property if the tool is instantiated
    if (control.tool && typeof control.tool !== 'function') {
      (control.tool as any)[option.toolProperty] = option.value;
    }

    // Close the submenu
    this.closeTooltip();

    // Activate this control
    await this.handleControlClick(control);
  }

  render() {
    const activeToolConfig = this.activeControl?.tool
      ? KritzelToolConfigHelper.getToolConfig(this.activeControl.tool as any)
      : null;
    const hasConfigUI = activeToolConfig !== null;

    // Separate tool controls from config control
    const toolControls = this.internalToolbar.filter(c => c.type === 'tool' || c.type === 'separator');
    const configControl = this.internalToolbar.find(c => c.type === 'config' && c.name === this.firstConfig?.name);

    return (
      <Host
        style={{ display: this.visible ? '' : 'none' }}
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
            terms={this.terms}
            onUndo={() => this.kritzelEngine?.undo()}
            onRedo={() => this.kritzelEngine?.redo()}
            onDelete={() => this.kritzelEngine?.delete()}
          ></kritzel-utility-panel>
        )}

        <div class="kritzel-toolbar">
          {/* Left scroll indicator gradient */}
          <div class={{ 'scroll-indicator-left': true, 'visible': this.canScrollLeft }}></div>

          {/* Scrollable tool controls container */}
          <div class="kritzel-tools-scroll" ref={el => (this.toolsScrollRef = el)} onScroll={this.handleToolsScroll}>
            {toolControls.map(control => {
              // Check if this control has sub-options (split-button)
              if (control.subOptions?.length) {
                const selectedSubOption = this.getSelectedSubOption(control);
                const isActive = this.activeControl?.name === control.name;
                const isDisabled = this.isControlDisabled(control);

                return (
                  <div
                    class={{
                      'kritzel-control-split': true,
                      'selected': isActive,
                    }}
                    key={control.name}
                    data-testid={`tool-${control.name}`}
                    ref={el => {
                      if (el) (control as any)._anchorRef = el;
                    }}
                  >
                    <button
                      class={{
                        'kritzel-control-main': true,
                        'disabled': isDisabled,
                      }}
                      disabled={isDisabled}
                      onClick={() => this.handleControlClick(control)}
                      aria-label={selectedSubOption?.label}
                      aria-disabled={isDisabled}
                      data-testid={`tool-${control.name}-main`}
                    >
                      <kritzel-icon name={selectedSubOption?.icon || control.icon}></kritzel-icon>
                    </button>
                    <button
                      class={{
                        'kritzel-control-dropdown': true,
                        'visible': isActive,
                        'disabled': isDisabled,
                      }}
                      disabled={isDisabled}
                      ref={el => {
                        if (el) (control as any)._triggerRef = el;
                      }}
                      aria-label={`Select ${control.name} options`}
                      aria-disabled={isDisabled}
                      data-testid={`tool-${control.name}-dropdown`}
                      tabIndex={isActive ? 0 : -1}
                    >
                      <kritzel-icon name="chevronDown" size={12}></kritzel-icon>
                    </button>

                    <kritzel-tooltip anchorElement={(control as any)._anchorRef} triggerElement={(control as any)._triggerRef}>
                      <div class="kritzel-submenu-content">
                        {control.subOptions.map(option => (
                          <button
                            class={{
                              'kritzel-submenu-item': true,
                              'active': option.id === selectedSubOption?.id,
                            }}
                            key={option.id}
                            data-testid={`suboption-${option.id}`}
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

              if (control.type === 'separator') {
                return <div class="kritzel-control-separator" key={control.name}></div>;
              }

              // Regular tool control (no sub-options)
              return (
                <button
                  class={{
                    'kritzel-control': true,
                    'selected': this.activeControl?.name === control?.name,
                    'disabled': this.isControlDisabled(control),
                  }}
                  disabled={this.isControlDisabled(control)}
                  key={control.name}
                  data-testid={`tool-${control.name}`}
                  onClick={_event => this.handleControlClick?.(control)}
                  aria-label={control.name.charAt(0).toUpperCase() + control.name.slice(1)}
                  aria-disabled={this.isControlDisabled(control)}
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

              <kritzel-tooltip anchorElement={this.host.shadowRoot?.querySelector('.kritzel-config-container') as HTMLElement} triggerElement={this.configTriggerRef}>
                <kritzel-tool-config
                  tool={this.activeControl.tool as any}
                  theme={this.theme}
                  engine={this.kritzelEngine}
                  terms={this.terms}
                  onToolChange={event => this.handleToolChange?.(event)}
                  onDisplayValuesChange={this.handleDisplayValuesChange}
                  style={{ width: '100%', height: '100%' }}
                ></kritzel-tool-config>
              </kritzel-tooltip>

              <div
                tabIndex={hasConfigUI ? 0 : -1}
                class="kritzel-config"
                data-testid="tool-config"
                ref={el => {
                  if (el) this.configTriggerRef = el;
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    (event.target as HTMLElement).click();
                  }
                }}
                style={{
                  cursor: 'pointer',
                }}
              >
                {this.displayValues && (
                  <div class="color-container">
                    <kritzel-color
                      value={this.displayValues.color}
                      theme={this.theme}
                      size={18}
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
