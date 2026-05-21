import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelLineTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
} from 'kritzel-angular';

@Component({
  selector: 'app-custom-toolbar-2',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor [controls]="controls"></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomToolbar2Component {
  controls: KritzelToolbarControl[] = [
    { type: 'tool', tool: KritzelSelectionTool, name: 'Selection', icon: 'selection', isDefault: true },
    { type: 'separator', name: 'separator-1' },
    { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'brush' },
    { type: 'tool', tool: KritzelLineTool, name: 'Line', icon: 'line' },
    { type: 'tool', tool: KritzelShapeTool, name: 'Shape', icon: 'shape' },
    { type: 'tool', tool: KritzelTextTool, name: 'Text', icon: 'text' },
  ];
}
