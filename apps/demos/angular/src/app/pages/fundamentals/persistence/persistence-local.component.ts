import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  ActiveWorkspaceChangeEvent,
  KritzelEditor,
  IndexedDBSyncProvider,
  KritzelSyncConfig,
  KritzelWorkspace,
} from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-persistence-local',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor-wrap">
      <kritzel-editor
        editorId="persistence-local"
        [syncConfig]="syncConfig"
        [workspaces]="workspaces()"
        [activeWorkspaceId]="activeWorkspaceId()"
        [theme]="'light'"
        [themes]="themes"
        [loginConfig]="undefined"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
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

      label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        cursor: pointer;
        padding: 4px 8px;
        border: 1px solid var(--angular-border);
        border-radius: 999px;
        transition:
          border-color 140ms ease,
          background-color 140ms ease;
        background: #fff;
      }

      label:hover {
        border-color: var(--angular-primary);
        background: #fff5f7;
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
export class PersistenceLocalComponent {
  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [IndexedDBSyncProvider],
    appStateId: 'persistence-local',
  };

  workspaces = signal<KritzelWorkspace[]>([
    new KritzelWorkspace({
      id: 'persistence-local-board',
      name: 'Local Board',
      objects: createSeedObjects(),
    }),
  ]);
  activeWorkspaceId = signal<string | undefined>('persistence-local-board');

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }
}
