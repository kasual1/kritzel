import { Component, Host, Listen, Prop, h } from '@stencil/core';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelImageTool } from '../../../classes/tools/image-tool.class';
import { KritzelIconRegistry } from '../../../classes/icon-registry.class';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {
  @Prop()
  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      isDefault: true,
      icon: 'pen',
      config: {
        type: 'pen',
        color: '#000000',
        size: 16,
        palettes: {
          pen: [
            '#000000',
            '#ff5252',
            '#ffbc00',
            '#00c853',
            '#0000FF',
            '#d500f9',
            '#fafafa',
            '#a52714',
            '#ee8100',
            '#558b2f',
            '#01579b',
            '#8e24aa',
            '#90a4ae',
            '#ff4081',
            '#ff6e40',
            '#aeea00',
            '#304ffe',
            '#7c4dff',
            '#cfd8dc',
            '#f8bbd0',
            '#ffccbc',
            '#f0f4c3',
            '#9fa8da',
            '#d1c4e9',
          ],
          highlighter: [
            '#0000006e',
            '#ff52526e',
            '#ffbb006e',
            '#00c8536e',
            '#0000FF6e',
            '#d500f96e',
            '#fafafa6e',
            '#a527146e',
            '#ee81006e',
            '#558b2f6e',
            '#01579b6e',
            '#8e24aa6e',
            '#90a4ae6e',
            '#ff40816e',
            '#ff6e406e',
            '#aeea006e',
            '#304ffe6e',
            '#7c4dff6e',
            '#cfd8dc6e',
            '#f8bbd06e',
            '#ffccbc6e',
            '#f0f4c36e',
            '#9fa8da6e',
            '#d1c4e96e',
          ],
        },
      },
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: 'eraser',
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: '#000000',
        size: 8,
        fontFamily: 'Arial',
        palette: [
          '#000000',
          '#ff5252',
          '#ffbc00',
          '#00c853',
          '#0000FF',
          '#d500f9',
          '#fafafa',
          '#a52714',
          '#ee8100',
          '#558b2f',
          '#01579b',
          '#8e24aa',
          '#90a4ae',
          '#ff4081',
          '#ff6e40',
          '#aeea00',
          '#304ffe',
          '#7c4dff',
          '#cfd8dc',
          '#f8bbd0',
          '#ffccbc',
          '#f0f4c3',
          '#9fa8da',
          '#d1c4e9',
        ],
      },
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: 'image',
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'config',
      type: 'config',
    },
  ];

  @Prop()
  customSvgIcons: Record<string, string> = {};

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

  render() {
    return (
      <Host>
        <kritzel-engine></kritzel-engine>
        <kritzel-controls controls={this.controls}></kritzel-controls>
      </Host>
    );
  }
}
