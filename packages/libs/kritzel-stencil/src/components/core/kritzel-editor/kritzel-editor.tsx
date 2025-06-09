import { Component, Host, Listen, Prop, h } from '@stencil/core';
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

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: TouchEvent) {
    if(event.cancelable) {
    event.preventDefault();
    }
  }

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
