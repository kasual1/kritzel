import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  KritzelTheme,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-theming-apply',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button
        [class.active]="activeName === 'angular-theme'"
        (click)="activeName = 'angular-theme'"
      >
        Light
      </button>
      <button
        [class.active]="activeName === 'angular-theme-dark'"
        (click)="activeName = 'angular-theme-dark'"
      >
        Dark
      </button>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="theming-apply"
        [theme]="activeName"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="true"
        (isReady)="onIsReady($event)"
      ></kritzel-editor>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .toolbar {
        display: flex;
        gap: 8px;
        padding: 8px;
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
      }
      .toolbar button {
        padding: 4px 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        background: #fff;
      }
      .toolbar button:hover {
        background: #dd0031;
        color: #fff;
        border-color: #dd0031;
      }
      .toolbar button.active {
        background: #dd0031;
        color: #fff;
        border-color: #dd0031;
      }
      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class ThemingApplyComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes: KritzelTheme[] = [angularThemeLight, angularThemeDark];
  activeName: string = 'angular-theme';

  

  async onIsReady(_event: CustomEvent) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
