import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { InfoPanelComponent } from '../../../components/info-panel.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-import-export-workspace-export',
  imports: [InfoPanelComponent, KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="previewJson()">Preview as JSON</button>
      <button (click)="downloadJson()">Download JSON</button>
    </app-toolbar>
    <div class="content">
      <div class="editor-wrap">
        <kritzel-editor
          editorId="import-export-workspace-export"
          [theme]="'light'"
          [themes]="themes"
          [workspaces]="workspaces()"
          [isPanningEnabled]="false"
          [isZoomingEnabled]="false"
          [isMoreMenuVisible]="false"
          [isWorkspaceManagerVisible]="false"
        ></kritzel-editor>
      </div>
      <app-info-panel>
        <h3>Exported Workspace</h3>
        <pre>{{ jsonPreview() }}</pre>
      </app-info-panel>
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
      .content {
        flex: 1;
        display: flex;
        min-height: 0;
      }
      .editor-wrap {
        flex: 1 1 60%;
        position: relative;
      }
      kritzel-editor {
        display: block;
        height: 100%;
      }
      app-info-panel {
        --demo-info-panel-width: 300px;
      }
      pre {
        margin: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.45;
      }
    `,
  ],
})
export class ImportExportWorkspaceExportComponent {
  editor = viewChild(KritzelEditor);

  jsonPreview = signal('Click "Preview as JSON" to see the exported workspace.');
  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({
      id: 'workspace-export',
      name: 'Workspace Export',
      objects: createSeedObjects(),
    }),
  ]);

  async previewJson(): Promise<void> {
    const json = await this.editor()?.exportAsJson();
    if (!json) return;

    this.jsonPreview.set(json);
  }

  async downloadJson(): Promise<void> {
    await this.editor()?.downloadAsJson();
  }
}
