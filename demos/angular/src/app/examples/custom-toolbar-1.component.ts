import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
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
    { type: 'tool', tool: KritzelSelectionTool, name: 'Select', icon: 'cursor', isDefault: true },
    { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'pen' },
  ];
}
