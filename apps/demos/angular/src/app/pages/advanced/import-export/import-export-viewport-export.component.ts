import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { UpdrawEditor, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-import-export-viewport-export',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="exportAsPng()">Export as PNG</button>
      <button (click)="exportAsSvg()">Export as SVG</button>
    </app-toolbar>
    <div class="editor-wrap">
      <updraw-editor
        editorId="import-export-viewport-export"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
      ></updraw-editor>
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
      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class ImportExportViewportExportComponent {
  editor = viewChild(UpdrawEditor);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  async exportAsPng(): Promise<void> {
    await this.editor()?.exportViewportAsPng();
  }

  async exportAsSvg(): Promise<void> {
    await this.editor()?.exportViewportAsSvg();
  }
}
