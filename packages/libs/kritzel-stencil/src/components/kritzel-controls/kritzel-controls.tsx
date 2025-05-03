import { Component, h, Prop, State, Element, Watch, Host, Listen } from '@stencil/core';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../interfaces/toolbar-control.interface';
import { KritzelImageTool } from '../../classes/tools/image-tool.class';

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
      isDefault: true,
      config: {
        color: '#000000',
        size: 24,
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
        color: '00FFFF',
        size: 4,
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
  activeConfig: ToolConfig | null = null;

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
        await this.kritzelEngine.registerTool(c.name, c.tool);
      }

      if (c.type === 'tool' && c.isDefault) {
        await this.kritzelEngine.changeActiveTool(c.name);
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

  handleControlClick(control: KritzelToolbarControl) {
    if (control.type === 'tool') {
      this.activeConfig = { ...control.config };
      this.kritzelEngine.changeActiveTool(control.name);
      this.kritzelEngine.changeColor(this.activeConfig.color);
    }
  }

  handleConfigClick(event: MouseEvent) {
    event.stopPropagation();
    this.tooltipVisible = !this.tooltipVisible;
    this.kritzelEngine.disable();
  }

  handleColorChange(event: CustomEvent) {
    this.activeConfig = {
      ...this.activeConfig,
      color: event.detail,
    };

    this.controls.find(control => {
      if (control.name === this.activeControl && control.type === 'tool') {
        control.config = this.activeConfig;
      }
    });

    this.kritzelEngine.changeColor(this.activeConfig.color);
  }

  handleSizeChange(event: CustomEvent) {
    this.activeConfig = {
      ...this.activeConfig,
      size: event.detail,
    };

    this.controls.find(control => {
      if (control.name === this.activeControl && control.type === 'tool') {
        control.config = this.activeConfig;
      }
    });

    this.kritzelEngine.changeStrokeSize(this.activeConfig.size);
  }

  render() {
    return (
      <Host>
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

            if (control.type === 'config' && control.name === this.firstConfig?.name) {
              return (
                <div class="kritzel-config-container" key={control.name}>
                  {this.tooltipVisible && (
                    <div class="kritzel-tooltip" onClick={event => this.preventDefault(event)}>
                      <kritzel-color-palette selectedColor={this.activeConfig?.color} onColorChange={color => this.handleColorChange(color)}></kritzel-color-palette>
                      <kritzel-stroke-size selectedSize={this.activeConfig?.size} onSizeChange={size => this.handleSizeChange(size)}></kritzel-stroke-size>
                    </div>
                  )}

                  {this.tooltipVisible && <div class="kritzel-tooltip-arrow"></div>}

                  <div class="kritzel-config" onClick={event => this.handleConfigClick?.(event)}>
                    <div
                      style={{
                        backgroundColor: this.activeConfig?.color || 'transparent',
                        width: this.activeConfig?.size + 'px',
                        height: this.activeConfig?.size + 'px',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    ></div>
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
