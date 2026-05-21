import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelEraserTool,
  KritzelToolbarControl,
} from 'kritzel-angular';

@Component({
  selector: 'app-custom-toolbar-1',
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
export class CustomToolbar1Component {
  controls: KritzelToolbarControl[] = [
    { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'brush', isDefault: true },
    { type: 'separator', name: 'separator-1' },
    { type: 'tool', tool: KritzelEraserTool, name: 'Eraser', icon: 'eraser' },
    { type: 'tool', tool: KritzelSelectionTool, name: 'Selection', icon: 'selection' },
  ];
}
