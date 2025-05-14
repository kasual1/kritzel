import { Component, Host, Prop, h} from '@stencil/core';
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

  componentWillLoad() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  render() {
    return (
      <Host>
        <kritzel-engine></kritzel-engine>
        <kritzel-controls controls={this.controls}></kritzel-controls>
      </Host>
    );
  }
}
