import { Component, h, State } from '@stencil/core';
import { KritzelIconName } from '../../enums/icon-name.enum';
import { Element } from '@stencil/core';

interface KritzelToolbarControl {
  name: string;
  icon: KritzelIconName;
}
@Component({
  tag: 'kritzel-controls',
  styleUrl: 'kritzel-controls.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelControls {
  @State() controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      icon: KritzelIconName.cursor,
    },
    {
      name: 'pen',
      icon: KritzelIconName.pen,
    },
    {
      name: 'eraser',
      icon: KritzelIconName.eraser,
    },
    {
      name: 'text',
      icon: KritzelIconName.type,
    },
    {
      name: 'image',
      icon: KritzelIconName.image,
    },
  ];

  @State() selectedControl: string | null = null;

  @Element() host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  async componentWillLoad() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngine) {
      throw new Error('kritzel-engine not found in parent element.');
    }
    
    this.kritzelEngine?.changeActiveTool('pen');
    this.selectedControl = 'pen';
  }

  preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  handleControlClick(controlName: string) {
    this.selectedControl = controlName;
    this.kritzelEngine?.changeActiveTool(controlName);
  }

  render() {
    return (
      <div class="kritzel-controls">
        {this.controls.map(control => (
          <button
            class={{
              'kritzel-control': true,
              'selected': this.selectedControl === control.name,
            }}
            key={control.name}
            onClick={event => {
              this.preventDefault(event);
              this.handleControlClick(control.name);
            }}
          >
            <kritzel-icon name={control.icon}></kritzel-icon>
          </button>
        ))}
      </div>
    );
  }
}
