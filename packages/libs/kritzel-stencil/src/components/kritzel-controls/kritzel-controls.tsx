import { Component, h, Prop } from '@stencil/core';
import { KritzelIconName } from '../../enums/icon-name.enum';
import { Element } from '@stencil/core';
import { KritzelSelectionTool as KritzelImageTool } from '../../classes/tools/selection-tool.class';
import { KritzelBrushTool } from '../../classes/tools/brush-tool.class';
import { KritzelEraserTool } from '../../classes/tools/eraser-tool.class';
import { KritzelTextTool } from '../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../interfaces/toolbar-control.interface';

@Component({
  tag: 'kritzel-controls',
  styleUrl: 'kritzel-controls.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelControls {

  @Prop()
  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      class: KritzelImageTool,
      icon: KritzelIconName.cursor,
    },
    {
      name: 'brush',
      class: KritzelBrushTool,
      icon: KritzelIconName.pen,
      isDefault: true
    },
    {
      name: 'eraser',
      class: KritzelEraserTool,
      icon: KritzelIconName.eraser,
    },
    {
      name: 'text',
      class: KritzelTextTool,
      icon: KritzelIconName.type,
    },
    {
      name: 'image',
      class: KritzelImageTool,
      icon: KritzelIconName.image,
    },
  ];

  @Prop()
  selectedControl: string | null = null;

  @Element() 
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  async componentWillLoad() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngine) {
      throw new Error('kritzel-engine not found in parent element.');
    }
    
    this.controls.forEach(async c => {
      await this.kritzelEngine.registerTool(c.name, c.class);

      if(c.isDefault) {
        await this.kritzelEngine.changeActiveTool(c.name);
      }
    });
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
