import { Component, Host, State, h} from '@stencil/core';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {

  @State()
  activeControl: string | null = null;

  onActiveToolChange(event: CustomEvent) {
    this.activeControl = event.detail.name;
  }

  render() {
    return (
      <Host>
        <kritzel-engine onActiveToolChange={ev => this.onActiveToolChange(ev)}></kritzel-engine>
        <kritzel-controls activeControl={this.activeControl}></kritzel-controls>
      </Host>
    );
  }
}
