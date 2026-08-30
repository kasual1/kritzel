import { Component, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-import-export-viewport-export',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Viewport Export</span>
      <button (click)="exportAsPng()">Export as PNG</button>
      <button (click)="exportAsSvg()">Export as SVG</button>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="import-export-viewport-export"
        [theme]="'light'"
        [themes]="themes"
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
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
      }
      .label {
        font-weight: 700;
        font-size: 13px;
        color: #dd0031;
        margin-right: 4px;
      }
      .toolbar button {
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        background: #fff;
      }
      .toolbar button:hover {
        background: #e8e8e8;
      }
      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class ImportExportViewportExportComponent {
  editor = viewChild(KritzelEditor);

  themes = [angularThemeLight, angularThemeDark];

  async onReady(_event: CustomEvent<EditorIsReadyEvent>): Promise<void> {
    for (const obj of createSeedObjects()) {
      await this.editor()?.addObject(obj);
    }
  }

  async exportAsPng(): Promise<void> {
    await this.editor()?.exportViewportAsPng();
  }

  async exportAsSvg(): Promise<void> {
    await this.editor()?.exportViewportAsSvg();
  }
}
