import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { KritzelEditor, HocuspocusSyncProvider, IndexedDBSyncProvider, KritzelSyncConfig, EditorIsReadyEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-persistence-hocuspocus',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Persistence Provider:</span>
      <span class="status">IndexedDB + Hocuspocus configured</span>
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="persistence-hocuspocus"
        [syncConfig]="syncConfig"
        [theme]="'light'"
        [themes]="themes"
        [loginConfig]="undefined"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
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
        background: linear-gradient(180deg, #fff8f9 0%, #ffffff 100%);
      }

      .status {
        font-size: 12px;
        color: var(--angular-primary-hover);
        border: 1px solid #f1bdc9;
        background: #fff5f7;
        padding: 3px 8px;
        border-radius: 999px;
      }

      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class PersistenceHocuspocusComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    appStateId: 'kritzel-docs-account',
    providers: [
      IndexedDBSyncProvider,
      HocuspocusSyncProvider.with({
        url: 'wss://your-hocuspocus-server.com',
        token: () => this.getAccessToken(),
      }),
    ],
  };

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length > 0) {
      return;
    }

    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  private getAccessToken(): string {
    return 'demo-access-token';
  }
}
