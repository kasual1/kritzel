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
        type: 'pen',
        color: '#000000',
        size: 16,
        palettes: {
          pen: [
            '#000000',
            '#ff5252',
            '#ffbc00',
            '#00c853',
            '#0000FF',
            '#d500f9',
            '#fafafa',
            '#a52714',
            '#ee8100',
            '#558b2f',
            '#01579b',
            '#8e24aa',
            '#90a4ae',
            '#ff4081',
            '#ff6e40',
            '#aeea00',
            '#304ffe',
            '#7c4dff',
            '#cfd8dc',
            '#f8bbd0',
            '#ffccbc',
            '#f0f4c3',
            '#9fa8da',
            '#d1c4e9',
          ],
          highlighter: [
            '#0000006e',
            '#ff52526e',
            '#ffbb006e',
            '#00c8536e',
            '#0000FF6e',
            '#d500f96e',
            '#fafafa6e',
            '#a527146e',
            '#ee81006e',
            '#558b2f6e',
            '#01579b6e',
            '#8e24aa6e',
            '#90a4ae6e',
            '#ff40816e',
            '#ff6e406e',
            '#aeea006e',
            '#304ffe6e',
            '#7c4dff6e',
            '#cfd8dc6e',
            '#f8bbd06e',
            '#ffccbc6e',
            '#f0f4c36e',
            '#9fa8da6e',
            '#d1c4e96e',
          ],
        },
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
        palette: [
          '#000000',
          '#ff5252',
          '#ffbc00',
          '#00c853',
          '#0000FF',
          '#d500f9',
          '#fafafa',
          '#a52714',
          '#ee8100',
          '#558b2f',
          '#01579b',
          '#8e24aa',
          '#90a4ae',
          '#ff4081',
          '#ff6e40',
          '#aeea00',
          '#304ffe',
          '#7c4dff',
          '#cfd8dc',
          '#f8bbd0',
          '#ffccbc',
          '#f0f4c3',
          '#9fa8da',
          '#d1c4e9',
        ],
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
          style={{
            position: 'absolute',
            bottom: '56px',
            left: '12px',
          }}
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
                  <div
                    class={{
                      'kritzel-tooltip': true,
                      'kritzel-tooltip--visible': this.tooltipVisible,
                    }}
                    onClick={event => this.preventDefault(event)}
                  >
                    {this.activeControl.name === 'brush' && (
                      <kritzel-control-brush-config tool={this.activeToolAsBrushTool} onToolChange={event => this.handleToolChange?.(event)}></kritzel-control-brush-config>
                    )}

                    {this.activeControl.name === 'text' && (
                      <kritzel-control-text-config tool={this.activeToolAsTextTool} onToolChange={event => this.handleToolChange?.(event)}></kritzel-control-text-config>
                    )}
                  </div>

                  <div
                    class={{
                      'kritzel-tooltip-arrow': true,
                      'kritzel-tooltip-arrow--visible': this.tooltipVisible,
                    }}
                  ></div>

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
