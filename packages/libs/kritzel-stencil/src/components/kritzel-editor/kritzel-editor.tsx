import { Component, Host, Prop, State, h} from '@stencil/core';
import { KritzelIconRegistry } from '../../classes/icon-registry.class';
import { KritzelToolbarControl } from '../../components';
import { KritzelSelectionTool } from '../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {

  @Prop()
  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'heart',
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
      name: 'config',
      type: 'config',
    }
  ]

  @Prop()
  customSvgIcons: Record<string, string> = {
    'heart': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-icon lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
  };

  @State()
  activeControl: string | null = null;

  componentWillLoad() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  onActiveToolChange(event: CustomEvent) {
    this.activeControl = event.detail.name;
  }

  render() {
    return (
      <Host>
        <kritzel-engine onActiveToolChange={ev => this.onActiveToolChange(ev)}></kritzel-engine>
        <kritzel-controls controls={this.controls} activeControl={this.activeControl}></kritzel-controls>
      </Host>
    );
  }
}
