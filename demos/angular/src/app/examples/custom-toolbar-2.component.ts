import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG,
} from 'kritzel-angular';

@Component({
  selector: 'app-custom-toolbar-2',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <kritzel-editor [controls]="controls"></kritzel-editor> `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomToolbar2Component {
  controls: KritzelToolbarControl[] = [
    {
      tool: KritzelSelectionTool,
      type: 'tool',
      name: 'Select',
      icon: 'cursor',
    },
    {
      tool: KritzelBrushTool,
      type: 'tool',
      name: 'Brush',
      icon: 'pen',
      isDefault: true,
      config: DEFAULT_BRUSH_CONFIG,
    },
    { type: 'config', name: 'config' },
  ];
}
