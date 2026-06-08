import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { KritzelEditor } from 'kritzel-angular';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor [theme]="'angular-theme'" [themes]="themes"></kritzel-editor>`,
})
export class EditorPageComponent {
  themes = [angularThemeLight, angularThemeDark];
}
