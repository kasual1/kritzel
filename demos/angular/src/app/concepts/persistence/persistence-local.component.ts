import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  IndexedDBSyncProvider,
  KritzelSyncConfig,
  EditorIsReadyEvent,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-collaboration-local',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Persistence Provider:</span>
      <span class="status">IndexedDB enabled</span>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="collaboration-local"
        [syncConfig]="syncConfig"
        [theme]="'angular-theme'"
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
export class CollaborationLocalComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [IndexedDBSyncProvider],
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
}
