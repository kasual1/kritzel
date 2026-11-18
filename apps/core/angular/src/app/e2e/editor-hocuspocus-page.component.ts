import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HocuspocusSyncProvider, UpmadeEditor, UpmadeSyncConfig } from '@upmade/angular-editor';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-hocuspocus-page',
  imports: [UpmadeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <upmade-editor
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
    ></upmade-editor>
  `,
})
export class EditorHocuspocusPageComponent {
  themes = [angularThemeLight, angularThemeDark];

  syncConfig: UpmadeSyncConfig = {
    providers: [HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com', connectionTimeout: 2000 })],
  };
}
