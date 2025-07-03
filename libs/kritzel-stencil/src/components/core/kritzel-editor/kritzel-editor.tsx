import { Component, Host, Listen, Prop, Element, h } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/registries/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { DEFAULT_KRITZEL_CONTROLS } from '../../../configs/default-toolbar-controls';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
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

  engineRef!: HTMLKritzelEngineElement;

  controlsRef!: HTMLKritzelControlsElement;

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev) {
    ev.preventDefault();
  }

  componentWillLoad() {
    this.registerCustomSvgIcons();
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  render() {
    return (
      <Host>
        <kritzel-engine ref={el => (this.engineRef = el)}></kritzel-engine>
        <kritzel-controls ref={el => (this.controlsRef = el)} controls={this.controls} style={this.hideControls ? { display: 'none' } : { display: 'flex' }}></kritzel-controls>
      </Host>
    );
  }
}
