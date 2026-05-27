import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { KritzelEditor, KritzelTheme, lightTheme } from 'kritzel-angular';

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
  template: `<kritzel-editor [themes]="themes" theme="branded-accent"></kritzel-editor>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class Theming1Component implements OnInit {
  themes = [brandedAccentTheme];
  ngOnInit(): void {
  }
}
