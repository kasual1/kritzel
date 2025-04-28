import { Component, Host, State, h} from '@stencil/core';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {

  @State()
  selectedControl: string | null = null;

  onActiveToolChange(event: CustomEvent) {
    this.selectedControl = event.detail.name;

    console.log('Selected control:', this.selectedControl);
  }

  render() {
    return (
      <Host>
        <kritzel-engine onActiveToolChange={ev => this.onActiveToolChange(ev)}></kritzel-engine>
        <kritzel-controls selectedControl={this.selectedControl}></kritzel-controls>
      </Host>
    );
  }
}
