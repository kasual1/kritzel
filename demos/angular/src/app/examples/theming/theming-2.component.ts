import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelTheme, lightTheme, KritzelThemeManager } from 'kritzel-stencil';

const customLightTheme: KritzelTheme = {
  ...lightTheme,
  name: 'custom-light',
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

@Component({
  selector: 'app-theming-2',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <kritzel-editor theme="custom-light"></kritzel-editor> `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Theming2Component implements OnInit {
  ngOnInit(): void {
    KritzelThemeManager.registerTheme(customLightTheme);
  }
}
