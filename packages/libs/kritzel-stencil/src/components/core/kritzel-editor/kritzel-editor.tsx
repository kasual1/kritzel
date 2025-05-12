import { Component, Host, Prop, State, h} from '@stencil/core';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { KritzelIconRegistry } from '../../../classes/icon-registry.class';

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
        <kritzel-history-toolbar></kritzel-history-toolbar>
        <kritzel-controls controls={this.controls} activeControl={this.activeControl}></kritzel-controls>
      </Host>
    );
  }
}
