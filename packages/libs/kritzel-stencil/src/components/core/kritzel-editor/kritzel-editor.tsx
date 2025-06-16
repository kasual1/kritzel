import { Component, Host, Listen, Prop, Element, h, State } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { DEFAULT_KRITZEL_CONTROLS } from '../../../configs/default-toolbar-controls';
import { KritzelBaseTool } from '../../../classes/tools/base-tool.class';

export type ToolConfig = Record<string, any>;

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: true,
})
export class KritzelEditor {
  @Prop()
  controls: KritzelToolbarControl[] = DEFAULT_KRITZEL_CONTROLS;

  @Prop()
  customSvgIcons: Record<string, string> = {};

  @Prop()
  hideControls: boolean = false;

  @Element()
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  @State()
  activeControl: KritzelToolbarControl | null = null;

  @State()
  firstConfig: ToolConfig | null = null;

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  componentWillLoad() {
    this.registerCustomSvgIcons();
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  private async registerTools() {
    if (!this.kritzelEngine) {
      console.warn('Kritzel engine is not ready yet');
      return;
    }

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

  render() {
    return (
      <Host>
        <kritzel-engine
          ref={el => {
            this.kritzelEngine = el as HTMLKritzelEngineElement;
            this.registerTools();
          }}
        ></kritzel-engine>

        <kritzel-controls controls={this.controls} activeControl={this.activeControl} style={this.hideControls ? { display: 'none' } : {}}></kritzel-controls>
      </Host>
    );
  }
}
