import { Component, h, Prop, State, Element, Watch, Host } from '@stencil/core';
import { KritzelIconName } from '../../enums/icon-name.enum';
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
      icon: KritzelIconName.cursor,
      onClick: (control: KritzelToolbarControl) => this.handleControlClick(control),
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: KritzelIconName.pen,
      isDefault: true,
      config: {
        color: 'black',
        size: 2,
      },
      onClick: (control: KritzelToolbarControl) => this.handleControlClick(control),
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: KritzelIconName.eraser,
      onClick: (control: KritzelToolbarControl) => this.handleControlClick(control),
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: KritzelIconName.type,
      config: {
        color: 'red',
        size: 2,
      },
      onClick: (control: KritzelToolbarControl) => this.handleControlClick(control),
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: KritzelIconName.image,
      onClick: (control: KritzelToolbarControl) => this.handleControlClick(control),
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'test',
      type: 'config',
      onClick: (_control: KritzelToolbarControl, event: MouseEvent) => this.handleConfigClick(event),
    },
  ];

  @Prop()
  activeControl: string | null = null;

  @State()
  activeConfig: ToolConfig | null = null;

  @State()
  tooltipVisible: boolean = false;

  @Element()
  host!: HTMLElement;

  @Watch('activeControl')
  handleActiveControlChange(newValue: string | null) {
    this.controls.forEach(control => {
      if (control.type === 'tool' && control.name === newValue) {
        this.activeConfig = { ...control.config };
      }
    });
  }

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  configContainerRefs = new Map<string, HTMLDivElement>();

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
    });
  }

  componentDidLoad() {
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleOutsideClick);
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

  handleOutsideClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('.kritzel-tooltip')) {
      return;
    }
    this.tooltipVisible = false;
    this.kritzelEngine.enable();
  };

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
                  onClick={event => control.onClick?.(control, event)}
                >
                  <kritzel-icon name={control.icon}></kritzel-icon>
                </button>
              );
            }

            if (control.type === 'divider') {
              return <div class="kritzel-divider" key={control.name}></div>;
            }

            if (control.type === 'config') {
              return (
                <div class="kritzel-config-container" key={control.name} ref={el => this.configContainerRefs.set(control.name, el as HTMLDivElement)}>
                  {this.tooltipVisible && (
                    <div class="kritzel-tooltip" onClick={event => this.preventDefault(event)}>
                      <kritzel-color-palette onColorChange={color => this.handleColorChange(color)}></kritzel-color-palette>
                      <kritzel-stroke-size></kritzel-stroke-size>
                    </div>
                  )}
                  <div class="kritzel-config" onClick={event => control.onClick?.(control, event)}>
                    <div
                      style={{
                        backgroundColor: this.activeConfig?.color || 'transparent',
                        width: '24px',
                        height: '24px',
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

        <div class="kritzel-config-mobile">
          <kritzel-color-palette onColorChange={color => this.handleColorChange(color)}></kritzel-color-palette>
          <kritzel-stroke-size></kritzel-stroke-size>
        </div>
      </Host>
    );
  }
}
