import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UpdrawEditor } from '@updraw/angular-editor';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-page',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<updraw-editor [theme]="'light'" [themes]="themes"></updraw-editor>`,
})
export class EditorPageComponent {
  themes = [angularThemeLight, angularThemeDark];
}
