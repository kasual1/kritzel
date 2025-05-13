import { Component, Host, Prop, State, h} from '@stencil/core';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { KritzelIconRegistry } from '../../../classes/icon-registry.class';
import { KritzelBaseTool } from '../../../components';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {

  @Prop()
  controls: KritzelToolbarControl[];

  @Prop()
  customSvgIcons: Record<string, string> = {};

  @State()
  activeTool: KritzelBaseTool | null = null;

  componentWillLoad() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  onActiveToolChange(event: CustomEvent) {
    this.activeTool = event.detail;
  }

  render() {
    return (
      <Host>
        <kritzel-engine onActiveToolChange={ev => this.onActiveToolChange(ev)}></kritzel-engine>
        <kritzel-controls controls={this.controls} activeTool={this.activeTool}></kritzel-controls>
      </Host>
    );
  }
}
