import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  KritzelEditor,
  BroadcastSyncProvider,
  KritzelSyncConfig,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-collaboration-local',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Cross-tab Sync</span>
      <span class="status">BroadcastChannel enabled</span>
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="collaboration-local"
        [syncConfig]="syncConfig"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [loginConfig]="undefined"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
      ></kritzel-editor>
    </div>
  `,
  styles: [
    `
      :host {
        --angular-primary: #dd0031;
        --angular-primary-hover: #b30027;
        --angular-text: #333333;
        --angular-border: #ebebeb;
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
        color: var(--angular-text);
        background: linear-gradient(160deg, #fff3f6 0%, #ffffff 46%);
      }

      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class CollaborationLocalComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  syncConfig: KritzelSyncConfig = {
    providers: [BroadcastSyncProvider],
  };

}
