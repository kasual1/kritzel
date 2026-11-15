import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { UpmadeEditor, UpmadeWorkspace } from '@upmade/angular-editor';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-import-dialog',
  imports: [UpmadeEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button type="button" (click)="openDialog()">Open import dialog</button>
    </app-toolbar>
    <upmade-editor
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
    ></upmade-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    upmade-editor { flex: 1; }
  `,
})
export class ImportDialogComponent {
  editor = viewChild(UpmadeEditor);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpmadeWorkspace({ objects: createSeedObjects() })]);

  async openDialog(): Promise<void> {
    await this.editor()?.openImportDialog();
  }
}