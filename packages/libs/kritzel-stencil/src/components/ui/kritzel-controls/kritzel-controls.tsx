import { Component, h, Prop, State, Element, Watch, Host, Listen } from '@stencil/core';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { KritzelImageTool } from '../../../classes/tools/image-tool.class';
import { ObjectHelper } from '../../../helpers/object.helper';
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
      icon: 'pen',
      config: {
        color: '#000000',
        size: 8,
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
      isDefault: true,
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

  @Prop()
  activeControl: KritzelToolbarControl | null = null;

  @Prop()
  activeTool: KritzelBaseTool | null = null;

  @State()
  activeConfig: ToolConfig | null = this.activeControl?.config || null;

  @State()
  firstConfig: ToolConfig | null = null;

  @State()
  tooltipVisible: boolean = false;

  @Element()
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  async componentWillLoad() {
    await this.initializeEngine();
    this.initializeTools();
  }

  private async initializeEngine() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngine) {
      throw new Error('kritzel-engine not found in parent element.');
    }
  }

  private initializeTools() {
    this.controls.forEach(async c => {
      if (c.type === 'tool' && c.tool) {
        c.tool = await this.kritzelEngine.registerTool(c.name, c.tool);
      }

      if (c.type === 'tool' && c.isDefault && c.tool) {
        await this.kritzelEngine.changeActiveTool(c.tool as KritzelBaseTool);

        const activeTool = await this.kritzelEngine.getActiveTool();

        this.activeConfig = (this.controls.find(control => control.name === c.name) as any)?.config || null;

        if (activeTool) {
          if (activeTool instanceof KritzelBrushTool) {
            activeTool.size = this.activeConfig?.size;
            activeTool.color = this.activeConfig?.color;
          }

          if (activeTool instanceof KritzelTextTool) {
            activeTool.fontFamily = this.activeConfig?.fontFamily;
            activeTool.fontSize = this.activeConfig?.size;
          }
        }
      }

      if (c.type === 'config') {
        if (this.firstConfig === null) {
          this.firstConfig = c;
        } else {
          console.warn('Only one config control is allowed. The first one will be used.');
        }
      }
    });
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

  @Watch('activeTool')
  handleActiveControlChange(tool: KritzelBaseTool | null) {
    this.activeControl = this.controls.find(control => control.name === tool.name) || null;
    this.controls.forEach(control => {
      if (control.type === 'tool' && control.name === tool.name) {
        this.activeConfig = { ...control.config };
      }
    });
  }

  preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  async handleControlClick(control: KritzelToolbarControl) {
    if (control.type === 'tool') {
      this.activeConfig = control.config ? { ...control.config } : null;

      await this.kritzelEngine.changeActiveTool(control.tool as KritzelBaseTool);

      const activeTool = await this.kritzelEngine.getActiveTool();

      if (activeTool) {
        if (activeTool instanceof KritzelBrushTool) {
          activeTool.size = this.activeConfig?.size;
          activeTool.color = this.activeConfig?.color;
        }

        if (activeTool instanceof KritzelTextTool) {
          activeTool.fontFamily = this.activeConfig?.fontFamily;
          activeTool.fontSize = this.activeConfig?.size;
        }
      }
    }
  }

  handleConfigClick(event: MouseEvent) {
    event.stopPropagation();
    this.tooltipVisible = !this.tooltipVisible;
    this.kritzelEngine.disable();
  }

  async handleFontFamilyChange(event: CustomEvent) {
    this.activeConfig = {
      ...this.activeConfig,
      fontFamily: event.detail,
    };

    this.activeControl.config = this.activeConfig;

    await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);

    const activeTool = await this.kritzelEngine.getActiveTool();

    if (activeTool) {
      if (activeTool instanceof KritzelBrushTool) {
        activeTool.size = this.activeConfig?.size;
        activeTool.color = this.activeConfig?.color;
      }

      if (activeTool instanceof KritzelTextTool) {
        activeTool.fontFamily = this.activeConfig?.fontFamily;
        activeTool.fontSize = this.activeConfig?.size;
        activeTool.fontColor = this.activeConfig?.color;
      }
    }
  }

  async handleColorChange(event: CustomEvent) {
    this.activeConfig = {
      ...this.activeConfig,
      color: event.detail,
    };

    this.activeControl.config = this.activeConfig;

    await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);

    const activeTool = await this.kritzelEngine.getActiveTool();

    if (activeTool) {
      if (activeTool instanceof KritzelBrushTool) {
        activeTool.size = this.activeConfig?.size;
        activeTool.color = this.activeConfig?.color;
      }

      if (activeTool instanceof KritzelTextTool) {
        activeTool.fontFamily = this.activeConfig?.fontFamily;
        activeTool.fontSize = this.activeConfig?.size;
        activeTool.fontColor = this.activeConfig?.color;
      }
    }
  }

  async handleSizeChange(event: CustomEvent) {
    this.activeConfig = {
      ...this.activeConfig,
      size: event.detail,
    };

     this.activeControl.config = this.activeConfig;

    await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);

    const activeTool = await this.kritzelEngine.getActiveTool();

    if (activeTool) {
      if (activeTool instanceof KritzelBrushTool) {
        activeTool.size = this.activeConfig?.size;
        activeTool.color = this.activeConfig?.color;
      }

      if (activeTool instanceof KritzelTextTool) {
        activeTool.fontFamily = this.activeConfig?.fontFamily;
        activeTool.fontSize = this.activeConfig?.size;
        activeTool.fontColor = this.activeConfig?.color;
      }
    }
  }

  async handleFontSizeChange(event: CustomEvent) {
    this.activeConfig = {
      ...this.activeConfig,
      size: event.detail,
    };

    this.activeControl.config = this.activeConfig;

    await this.kritzelEngine.changeActiveTool((this.activeControl as any).tool);

    const activeTool = await this.kritzelEngine.getActiveTool();

    if (activeTool) {
      if (activeTool instanceof KritzelBrushTool) {
        activeTool.size = this.activeConfig?.size;
        activeTool.color = this.activeConfig?.color;
      }

      if (activeTool instanceof KritzelTextTool) {
        activeTool.fontFamily = this.activeConfig?.fontFamily;
        activeTool.fontSize = this.activeConfig?.size;
        activeTool.fontColor = this.activeConfig?.color;
      }
    }
  }

  render() {
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
                  {this.tooltipVisible && (
                    <div class="kritzel-tooltip" onClick={event => this.preventDefault(event)}>
                      {this.activeControl.name === 'brush' && (
                        <kritzel-control-brush-config
                          type={this.activeConfig?.type}
                          color={this.activeConfig?.color}
                          size={this.activeConfig?.size}
                          onColorChange={event => this.handleColorChange?.(event)}
                          onSizeChange={event => this.handleFontSizeChange?.(event)}
                        ></kritzel-control-brush-config>
                      )}

                      {this.activeControl.name === 'text' && (
                        <kritzel-control-text-config
                          family={this.activeConfig?.fontFamily}
                          color={this.activeConfig?.color}
                          size={this.activeConfig?.size}
                          onFamilyChange={event => this.handleFontFamilyChange?.(event)}
                          onColorChange={event => this.handleColorChange?.(event)}
                          onSizeChange={event => this.handleFontSizeChange?.(event)}
                        ></kritzel-control-text-config>
                      )}
                    </div>
                  )}

                  {this.tooltipVisible && <div class="kritzel-tooltip-arrow"></div>}

                  <div
                    class="kritzel-config"
                    onClick={event => (!ObjectHelper.isEmpty(this.activeConfig) ? this.handleConfigClick?.(event) : null)}
                    style={{ cursor: ObjectHelper.isEmpty(this.activeConfig) ? 'default' : 'pointer' }}
                  >
                    {this.activeControl.name !== 'text' && (
                      <kritzel-color
                        value={this.activeConfig?.color}
                        size={this.activeConfig?.size}
                        style={{
                          borderRadius: '50%',
                          border: ObjectHelper.isEmpty(this.activeConfig) ? '1px dashed gray' : 'default',
                        }}
                      ></kritzel-color>
                    )}

                    {this.activeControl.name === 'text' && (
                      <kritzel-font fontFamily={this.activeConfig?.fontFamily} size={this.activeConfig?.size} color={this.activeConfig?.color}></kritzel-font>
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
