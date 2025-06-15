import { Component, Host, Listen, Prop, State, h } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { DEFAULT_KRITZEL_CONTROLS } from '../../../configs/default-toolbar-controls';

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

  @State()
  forceUpdate: number = 0;

  private engineReady: boolean = false;

  private controlsReady: boolean = false;

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  componentWillLoad() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  handleEngineReady() {
    this.engineReady = true;
    this.checkReadiness();
  }

  handleControlsReady() {
    this.controlsReady = true;
    this.checkReadiness();
  }

  checkReadiness() {
    if (this.engineReady && this.controlsReady) {
      console.info('KritzelEditor is ready');
      this.forceUpdate++;
    }
  }

  render() {
    return (
      <Host>

        <kritzel-dummy class="dummy-top"></kritzel-dummy>

        <kritzel-engine onEngineReady={() => this.handleEngineReady()}></kritzel-engine>

        <kritzel-dummy class="dummy-bottom"></kritzel-dummy>

        <kritzel-controls
          controls={this.controls}
          onControlsReady={() => this.handleControlsReady()}
          style={{
            visibility: 'hidden'
          }}
        ></kritzel-controls>
      </Host>
    );
  }
}
