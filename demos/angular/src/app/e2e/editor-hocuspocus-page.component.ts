import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HocuspocusSyncProvider, KritzelEditor, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-hocuspocus-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
    ></kritzel-editor>
  `,
})
export class EditorHocuspocusPageComponent {
  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com' })],
  };
}