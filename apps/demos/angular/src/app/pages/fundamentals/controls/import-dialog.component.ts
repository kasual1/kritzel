import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-import-dialog',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button type="button" (click)="openDialog()">Open import dialog</button>
    </app-toolbar>
    <kritzel-editor
      editorId="import-dialog"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isToolbarVisible]="false"
      [isUtilityPanelVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isMoreMenuVisible]="false"
      [isZoomPanelVisible]="false"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    kritzel-editor { flex: 1; }
  `,
})
export class ImportDialogComponent {
  editor = viewChild(KritzelEditor);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  async openDialog(): Promise<void> {
    await this.editor()?.openImportDialog();
  }
}