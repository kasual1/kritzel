import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelTheme, KritzelThemeManager, lightTheme, darkTheme } from 'kritzel-stencil';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-light',
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

const brandedDarkTheme: KritzelTheme = {
  ...darkTheme,
  name: 'branded-dark',
  global: {
    ...darkTheme.global,
    textPrimary: '#EDE7F6',
    textSecondary: '#D1C4E9',
  },
  engine: {
    ...darkTheme.engine,
    backgroundColor: '#12005e',
  },
  controls: {
    ...darkTheme.controls,
    backgroundColor: '#1a0080',
    controlSelectedBackgroundColor: '#BB86FC',
    controlSelectedColor: '#000000',
    controlHoverBackgroundColor: 'rgba(187, 134, 252, 0.12)',
  },
  selection: {
    ...darkTheme.selection,
    borderColor: '#BB86FC',
    handleColor: '#12005e',
  },
};

@Component({
  selector: 'app-theming-3',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor theme="branded-light"></kritzel-editor>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class Theming3Component implements OnInit {
  ngOnInit(): void {
    KritzelThemeManager.registerTheme(brandedLightTheme);
    KritzelThemeManager.registerTheme(brandedDarkTheme);
  }
}

