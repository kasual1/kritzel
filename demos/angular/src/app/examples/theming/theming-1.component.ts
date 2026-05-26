import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelTheme, lightTheme, KritzelThemeManager } from 'kritzel-stencil';

const brandedAccentTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-accent',
  controls: {
    ...lightTheme.controls,
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#6200EE',
    handleColor: '#ffffff',
  },
};

@Component({
  selector: 'app-theming-1',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor theme="branded-accent"></kritzel-editor>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class Theming1Component implements OnInit {
  ngOnInit(): void {
    KritzelThemeManager.initializeThemes([brandedAccentTheme]);
  }
}
