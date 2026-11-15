import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UpmadeEditor } from '@upmade/angular-editor';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-page',
  imports: [UpmadeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<upmade-editor [theme]="'light'" [themes]="themes"></upmade-editor>`,
})
export class EditorPageComponent {
  themes = [angularThemeLight, angularThemeDark];
}
