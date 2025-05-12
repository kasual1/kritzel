import { Component, h, Prop, State, Element, Watch, Host, Listen } from '@stencil/core';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../interfaces/toolbar-control.interface';
import { KritzelImageTool } from '../../classes/tools/image-tool.class';
import { ObjectHelper } from '../../helpers/object.helper';

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
  activeControl: string | null = null;

  @State()
  activeConfig: ToolConfig | null = (this.controls.find(control => control.name === this.activeControl) as any)?.config || null;

  @State()
  firstConfig: ToolConfig | null = null;

  @State()
  tooltipVisible: boolean = false;

  @State()
  isExpanded: boolean = false;

  @Element()
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  private toggleExpand = () => {
    this.isExpanded = !this.isExpanded;
  };

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
        await this.kritzelEngine.registerTool(c.name, c.tool);
      }

      if (c.type === 'tool' && c.isDefault) {
        await this.kritzelEngine.changeActiveTool(c.name);

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

  @Watch('activeControl')
  handleActiveControlChange(newValue: string | null) {
    this.controls.forEach(control => {
      if (control.type === 'tool' && control.name === newValue) {
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

      await this.kritzelEngine.changeActiveTool(control.name);

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

    this.controls.find(control => {
      if (control.name === this.activeControl && control.type === 'tool') {
        control.config = this.activeConfig;
      }
    });

    await this.kritzelEngine.changeActiveTool(this.activeControl);

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

    this.controls.find(control => {
      if (control.name === this.activeControl && control.type === 'tool') {
        control.config = this.activeConfig;
      }
    });

    await this.kritzelEngine.changeActiveTool(this.activeControl);

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

    this.controls.find(control => {
      if (control.name === this.activeControl && control.type === 'tool') {
        control.config = this.activeConfig;
      }
    });

    await this.kritzelEngine.changeActiveTool(this.activeControl);

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

    this.controls.find(control => {
      if (control.name === this.activeControl && control.type === 'tool') {
        control.config = this.activeConfig;
      }
    });

    await this.kritzelEngine.changeActiveTool(this.activeControl);

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
        <div class="kritzel-history-panel">
          <button class="kritzel-history-button" onClick={() => this.kritzelEngine?.undo()}>
            <kritzel-icon name="undo"></kritzel-icon>
          </button>
          <button class="kritzel-history-button" onClick={() => this.kritzelEngine?.redo()}>
            <kritzel-icon name="redo"></kritzel-icon>
          </button>

          <div class="kritzel-history-separator"></div>

          <button class="kritzel-history-button">
            <kritzel-icon name="delete" onClick={() => this.kritzelEngine?.delete()}></kritzel-icon>
          </button>
        </div>

        <div class="kritzel-controls">
          {this.controls.map(control => {
            if (control.type === 'tool') {
              return (
                <button
                  class={{
                    'kritzel-control': true,
                    'selected': this.activeControl === control.name,
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
                      {this.activeControl === 'text' && (
                        <kritzel-control-text-config
                          family={this.activeConfig?.fontFamily}
                          color={this.activeConfig?.color}
                          size={this.activeConfig?.size}
                        ></kritzel-control-text-config>
                      )}

                      {this.activeControl === 'brush' && (
                        <kritzel-control-brush-config type={this.activeConfig?.type} color={this.activeConfig?.color} size={this.activeConfig?.size}></kritzel-control-brush-config>
                      )}
                    </div>
                  )}

                  {this.tooltipVisible && <div class="kritzel-tooltip-arrow"></div>}

                  <div
                    class="kritzel-config"
                    onClick={event => (!ObjectHelper.isEmpty(this.activeConfig) ? this.handleConfigClick?.(event) : null)}
                    style={{ cursor: ObjectHelper.isEmpty(this.activeConfig) ? 'default' : 'pointer' }}
                  >
                    {this.activeControl !== 'text' && (
                      <div
                        class={{
                          'color-circle': true,
                          'white': this.activeConfig?.color === '#FFFFFF' || this.activeConfig?.color?.toLowerCase() === 'white',
                        }}
                        style={{
                          backgroundColor: this.activeConfig?.color,
                          width: `${this.activeConfig?.size || 24}px`,
                          height: `${this.activeConfig?.size || 24}px`,
                          borderRadius: '50%',
                          display: 'inline-block',
                          border: ObjectHelper.isEmpty(this.activeConfig) ? '1px dashed gray' : 'none',
                        }}
                      ></div>
                    )}

                    {this.activeControl === 'text' && (
                      <div
                        class="font-style-button"
                        style={{
                          fontFamily: this.activeConfig?.fontFamily,
                          fontSize: `${this.activeConfig?.size || 24}px`,
                          color: this.activeConfig?.color,
                        }}
                      >
                        A
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
