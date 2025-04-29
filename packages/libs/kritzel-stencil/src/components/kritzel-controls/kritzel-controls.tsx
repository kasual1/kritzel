import { Component, h, Prop, State, Element } from '@stencil/core';
import { KritzelIconName } from '../../enums/icon-name.enum';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../interfaces/toolbar-control.interface';
import { KritzelImageTool } from '../../classes/tools/image-tool.class';

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
      color: 'black',
    },
  ];

  @Prop()
  selectedControl: string | null = null;

  @State()
  activeTooltip: string | null = null;

  @Element()
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;
  private configContainerRefs = new Map<string, HTMLDivElement>();

  async componentWillLoad() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngine) {
      throw new Error('kritzel-engine not found in parent element.');
    }

    this.controls.forEach(async c => {
      if (c.tool) {
        await this.kritzelEngine.registerTool(c.name, c.tool);
      }

      if (c.isDefault) {
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
    if (control.tool) {
      debugger;
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

  render() {
    return (
      <div class="kritzel-controls">
        {this.controls.map(control => {
          if (control.type === 'tool') {
            return (
              <button
                class={{
                  'kritzel-control': true,
                  'selected': this.selectedControl === control.name,
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
              <div
                class="kritzel-config-container"
                key={control.name}
                ref={el => this.configContainerRefs.set(control.name, el as HTMLDivElement)}
              >
                {this.activeTooltip === control.name && (
                  <div class="kritzel-tooltip" onClick={e => e.stopPropagation()}>
                    {/* Placeholder for tooltip content/controls */}
                    <span>Tooltip Content Here</span>
                    <span>Tooltip Content Here</span>
                    <span>Tooltip Content Here</span>
                    <span>Tooltip Content Here</span>
                    <span>Tooltip Content Here</span>
                    <span>Tooltip Content Here</span>
                    <span>Tooltip Content Here</span>

                  </div>
                )}
                <div
                  class="kritzel-config"
                  onClick={event => this.handleConfigClick(event, control.name)}
                >
                  <div
                    style={{
                      backgroundColor: control.color || 'transparent',
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
