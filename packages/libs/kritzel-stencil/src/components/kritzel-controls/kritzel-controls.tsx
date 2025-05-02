import { Component, h, Prop, State, Element, Watch } from '@stencil/core';
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
      }
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: KritzelIconName.eraser,
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: KritzelIconName.type,
      config: {
        color: 'red',
        size: 2,
      }
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: KritzelIconName.image,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'test',
      type: 'config',
    },
  ];

  @Prop()
  activeControl: string | null = null;

  @State()
  activeTooltip: string | null = null;

  @State()
  activeConfig: ToolConfig | null = null;

  @Element()
  host!: HTMLElement;

  @Watch('activeControl')
  handleActiveControlChange(newValue: string | null) {
    this.controls.forEach(control => {
      if (control.type === 'tool' && control.name === newValue) {
        this.activeConfig = {...control.config};
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
    this.configContainerRefs.clear();
  }

  preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  handleControlClick(control: KritzelToolbarControl) {
    if (control.type === 'tool') {
      this.activeConfig = {...control.config};
      this.kritzelEngine?.changeActiveTool(control.name);
    }
  }

  handleConfigClick(event: MouseEvent, name: string) {
    event.stopPropagation();
    this.activeTooltip = this.activeTooltip === name ? null : name;
  }

  handleOutsideClick = (event: MouseEvent) => {
    if (!this.activeTooltip) {
      return;
    }

    const activeContainer = this.configContainerRefs.get(this.activeTooltip);
    if (activeContainer && !activeContainer.contains(event.target as Node)) {
      this.activeTooltip = null;
    }
  };

  handleColorChange(event: CustomEvent){
    this.kritzelEngine.changeColor(event.detail);
    
    this.activeConfig = {
      ...this.activeConfig,
      color: event.detail
    };
  }

  render() {
    return (
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
                onClick={event => {
                  this.preventDefault(event);
                  this.handleControlClick(control);
                }}
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
                {this.activeTooltip === control.name && (
                  <div class="kritzel-tooltip" onClick={event => this.preventDefault(event)}>
                    <kritzel-color-palette onColorChange={color => this.handleColorChange(color)}></kritzel-color-palette>
                    <kritzel-stroke-size></kritzel-stroke-size>
                  </div>
                )}
                <div class="kritzel-config" onClick={event => this.handleConfigClick(event, control.name)}>
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
    );
  }
}
