import { Component, h, Prop, State, Element, Host, Listen, Event, EventEmitter, Method } from '@stencil/core';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';


@Component({
  tag: 'kritzel-controls',
  styleUrl: 'kritzel-controls.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelControls {
  @Prop()
  controls: KritzelToolbarControl[] = [];

  @Prop({ mutable: true })
  activeControl: KritzelToolbarControl | null = null;

  @Prop({ mutable: true })
  firstConfig: KritzelToolbarControl | null = null;

  @Event()
  controlsReady: EventEmitter<void>;

  @Element()
  host!: HTMLElement;

  @State()
  tooltipVisible: boolean = false;

  @State()
  forceUpdate: number = 0;

  get activeToolAsTextTool() {
    return this.activeControl?.tool as KritzelTextTool;
  }

  get activeToolAsBrushTool() {
    return this.activeControl?.tool as KritzelBrushTool;
  }

  @Method()
  setActiveControl(control: KritzelToolbarControl) {
    this.activeControl = control;
  }

  @Method()
  setFirstConfig(control: KritzelToolbarControl) {
    this.firstConfig = control;
  }

  @Listen('activeToolChange', { target: 'document' })
  async handleActiveToolChange(event: CustomEvent) {
    this.activeControl = this.controls.find(control => control.tool === event.detail) || null;
    // await this.kritzelEngine?.setFocus();
  }

  @Listen('click', { target: 'document' })
  handleClick(_event: MouseEvent) {
    // const element = event.target as HTMLElement;

    // if (!this.kritzelEngine || element.closest('.kritzel-tooltip')) {
    //   return;
    // }

    this.tooltipVisible = false;
    // this.kritzelEngine.enable();
  }

  preventDefault(event: Event) {
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async handleControlClick(control: KritzelToolbarControl) {
    this.activeControl = control;

    if (this.activeControl.type === 'tool') {
      // await this.kritzelEngine.changeActiveTool(this.activeControl.tool as KritzelBaseTool);
    }
  }

  handleConfigClick(event: MouseEvent) {
    event.stopPropagation();
    this.tooltipVisible = !this.tooltipVisible;
    // this.kritzelEngine.disable();
  }

  async handleToolChange(event: CustomEvent) {
    this.activeControl = { ...this.activeControl, tool: event.detail };
    // await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);
  }

  render() {
    const hasNoConfig = this.activeControl?.config === undefined || this.activeControl?.config === null;

    return (
      <Host>
        <kritzel-utility-panel
          style={{
            position: 'absolute',
            bottom: '56px',
            left: '12px',
          }}
          // onUndo={() => this.kritzelEngine?.undo()}
          // onRedo={() => this.kritzelEngine?.redo()}
          // onDelete={() => this.kritzelEngine?.delete()}
        ></kritzel-utility-panel>

        <div class="kritzel-controls">
          {this.controls.map(control => {
            if (control.type === 'tool') {
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

            if (control.type === 'divider') {
              return <div class="kritzel-divider" key={control.name}></div>;
            }

            if (control.type === 'config' && control.name === this.firstConfig?.name && this.activeControl) {
              return (
                <div class="kritzel-config-container" key={control.name}>
                  <kritzel-tooltip isVisible={this.tooltipVisible} anchorElement={this.host.shadowRoot?.querySelector('.kritzel-config-container') as HTMLElement}>
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
                    class="kritzel-config"
                    onClick={event => this.handleConfigClick?.(event)}
                    style={{
                      cursor: this.activeControl.config ? 'pointer' : 'default',
                      pointerEvents: hasNoConfig ? 'none' : 'auto',
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

                    {hasNoConfig && <div class="no-config"></div>}
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
