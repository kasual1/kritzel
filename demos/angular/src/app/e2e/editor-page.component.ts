import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KritzelEditor } from 'kritzel-angular';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor [theme]="'angular-theme'" [themes]="themes" [licenseKey]="licenseKey"></kritzel-editor>`,
})
export class EditorPageComponent {
  themes = [angularThemeLight, angularThemeDark];

  licenseKey = `KRTZL1.eyJzdWIiOiJkZW1vIiwicGxhbiI6ImRldmVsb3BlciIsImlhdCI6MTc4MTY4MDExMSwiZXhwIjoxODEzMjE2MTExfQ.0o5Kme2El2P-l4szhACgb0N_6u7n3--ha2mlRtYeUQ_wq2kstb3fPfRUdh1IYF2qONAt9Gy8WbI6MUMRyJIkCA`
}
