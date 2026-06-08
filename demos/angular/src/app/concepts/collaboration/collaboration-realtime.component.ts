import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { KritzelEditor, IndexedDBSyncProvider, HocuspocusSyncProvider, KritzelSyncConfig, EditorIsReadyEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-collaboration-realtime',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Real-time Sync</span>
      <span class="status">Connected to Hocuspocus server</span>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="collaboration-realtime"
        [wheelEnabled]="false"
        [syncConfig]="syncConfig"
        [theme]="'angular-theme'"
        [themes]="themes"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
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
      background: radial-gradient(circle at 0% 0%, #fff3f6 0%, #ffffff 42%);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #ffffff;
      border-bottom: 1px solid var(--angular-border);
      box-shadow: 0 1px 0 #f8d9df;
    }

    .label {
      font-weight: 700;
      font-size: 13px;
      color: var(--angular-primary);
      letter-spacing: 0.2px;
    }

    .status {
      font-size: 12px;
      color: var(--angular-primary-hover);
      border: 1px solid #f1bdc9;
      background: #fff5f7;
      padding: 3px 8px;
      border-radius: 999px;
    }

    .editor-wrap { flex: 1; position: relative; }
  `],
})
export class CollaborationRealtimeComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [
      IndexedDBSyncProvider,
      HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com' }),
    ],
  };

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
      for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }
    }
}
