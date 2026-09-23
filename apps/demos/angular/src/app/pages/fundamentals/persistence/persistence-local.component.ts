import { Component, ChangeDetectionStrategy,  ViewChild } from '@angular/core';
import {
  EditorIsReadyEvent,
  KritzelEditor,
  IndexedDBSyncProvider,
  KritzelSyncConfig,
} from '@kritzel/angular-editor';
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
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [IndexedDBSyncProvider],
    appStateId: 'persistence-local',
  };


  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    // Only seed once: objects restored from IndexedDB must not be duplicated by fresh-id seed objects on reload.
    const existing = await this.editor.getAllObjects();
    if (existing.length > 0) {
      return;
    }

    await this.editor.addObjects(createSeedObjects());
  }
}
