import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelTheme, lightTheme } from 'kritzel-stencil';

@Component({
  selector: 'app-theming-2',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <kritzel-editor [theme]="customLightTheme"></kritzel-editor> `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Theming2Component {
  customLightTheme: KritzelTheme = {
    ...lightTheme,
    global: {
      ...lightTheme.global,
      textPrimary: '#1a0050',
      textSecondary: '#3d1e78',
    },
    engine: {
      ...lightTheme.engine,
      backgroundColor: '#faf7ff',
    },
    controls: {
      ...lightTheme.controls,
      backgroundColor: '#ffffff',
      controlSelectedBackgroundColor: '#6200EE',
      controlSelectedColor: '#ffffff',
      controlHoverBackgroundColor: 'rgba(98, 0, 238, 0.08)',
    },
    selection: {
      ...lightTheme.selection,
      borderColor: '#6200EE',
      handleColor: '#ffffff',
    },
  };
}
