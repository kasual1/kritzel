import { Component, h, Prop, State, Element, Host, Listen } from '@stencil/core';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { KritzelImageTool } from '../../../classes/tools/image-tool.class';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';

type ToolConfig = Record<string, any>;

@Component({
  tag: 'kritzel-controls',
  styleUrl: 'kritzel-controls.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelControls {
  @Prop()
  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      isDefault: true,
      icon: 'pen',
      config: {
        color: '#000000',
        size: 16,
      },
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: 'eraser',
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: '#000000',
        size: 8,
        fontFamily: 'Arial',
      },
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: 'image',
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'config',
      type: 'config',
    },
  ];

  @Prop({ mutable: true })
  activeControl: KritzelToolbarControl | null = null;

  @State()
  firstConfig: ToolConfig | null = null;

  @State()
  tooltipVisible: boolean = false;

  @Element()
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  get activeToolAsTextTool() {
    return this.activeControl?.tool as KritzelTextTool;
  }

  get activeToolAsBrushTool() {
    return this.activeControl?.tool as KritzelBrushTool;
  }

  async componentWillLoad() {
    await this.initializeEngine();
    await this.initializeTools();
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

  @Listen('activeToolChange', { target: 'document' })
  async handleActiveToolChange(event: CustomEvent) {
    this.activeControl = this.controls.find(control => control.tool === event.detail) || null;
    await this.kritzelEngine?.setFocus();
  }

  @Listen('click', { target: 'document' })
  handleClick(event: MouseEvent) {
    const element = event.target as HTMLElement;

    if (!this.kritzelEngine || element.closest('.kritzel-tooltip')) {
      return;
    }

    this.tooltipVisible = false;
    this.kritzelEngine.enable();
  }

  preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  async handleControlClick(control: KritzelToolbarControl) {
    this.activeControl = control;

    if (this.activeControl.type === 'tool') {
      await this.kritzelEngine.changeActiveTool(this.activeControl.tool as KritzelBaseTool);
    }
  }

  handleConfigClick(event: MouseEvent) {
    event.stopPropagation();
    this.tooltipVisible = !this.tooltipVisible;
    this.kritzelEngine.disable();
  }

  async handleToolChange(event: CustomEvent) {
    this.activeControl = { ...this.activeControl, tool: event.detail };
    await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);
  }

  render() {
    const hasNoConfig = this.activeControl?.config === undefined || this.activeControl?.config === null;

    return (
      <Host>
        <kritzel-utility-panel
          onUndo={() => this.kritzelEngine?.undo()}
          onRedo={() => this.kritzelEngine?.redo()}
          onDelete={() => this.kritzelEngine?.delete()}
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
                  <div class="kritzel-tooltip" style={{ display: this.tooltipVisible ? 'block' : 'none' }} onClick={event => this.preventDefault(event)}>
                    {this.activeControl.name === 'brush' && (
                      <kritzel-control-brush-config tool={this.activeToolAsBrushTool} onToolChange={event => this.handleToolChange?.(event)}></kritzel-control-brush-config>
                    )}

                    {this.activeControl.name === 'text' && (
                      <kritzel-control-text-config tool={this.activeToolAsTextTool} onToolChange={event => this.handleToolChange?.(event)}></kritzel-control-text-config>
                    )}
                  </div>

                  <div class="kritzel-tooltip-arrow" style={{ display: this.tooltipVisible ? 'block' : 'none' }}></div>

                  <div
                    class="kritzel-config"
                    onClick={event => this.handleConfigClick?.(event)}
                    style={{
                      cursor: this.activeControl.config ? 'pointer' : 'default',
                      pointerEvents: hasNoConfig ? 'none' : 'auto',
                    }}
                  >
                    {this.activeControl.tool instanceof KritzelBrushTool && (
                      <kritzel-color
                        value={this.activeToolAsBrushTool?.color}
                        size={this.activeToolAsBrushTool?.size}
                        style={{
                          borderRadius: '50%',
                          border: 'none',
                        }}
                      ></kritzel-color>
                    )}

                    {this.activeControl.tool instanceof KritzelTextTool && (
                      <kritzel-font
                        fontFamily={this.activeToolAsTextTool?.fontFamily}
                        size={this.activeToolAsTextTool?.fontSize}
                        color={this.activeToolAsTextTool?.fontColor}
                      ></kritzel-font>
                    )}

                    {hasNoConfig && (
                      <kritzel-color
                        value={this.activeToolAsBrushTool?.color}
                        size={24}
                        style={{
                          borderRadius: '50%',
                          border: '1px dashed gray',
                        }}
                      ></kritzel-color>
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
