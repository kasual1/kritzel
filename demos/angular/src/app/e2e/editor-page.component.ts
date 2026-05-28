import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KritzelEditor } from 'kritzel-angular';
import { customAngularTheme } from '../const/custom-angular-theme';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor [theme]="'angular-theme'" [themes]="themes"></kritzel-editor>`,
})
export class EditorPageComponent {
  themes = [customAngularTheme];
}
