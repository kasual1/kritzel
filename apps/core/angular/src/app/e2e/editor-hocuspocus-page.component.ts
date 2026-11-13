import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HocuspocusSyncProvider, UpdrawEditor, UpdrawSyncConfig } from '@updraw/angular-editor';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-hocuspocus-page',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <updraw-editor
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
    ></updraw-editor>
  `,
})
export class EditorHocuspocusPageComponent {
  themes = [angularThemeLight, angularThemeDark];

  syncConfig: UpdrawSyncConfig = {
    providers: [HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com', connectionTimeout: 2000 })],
  };
}
