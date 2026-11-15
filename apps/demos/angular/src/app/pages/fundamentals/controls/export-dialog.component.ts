import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  UpmadeEditor,
  UpmadeWorkspace,
} from '@upmade/angular-editor';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-export-dialog',
  imports: [UpmadeEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button type="button" (click)="openDialog()">Open export dialog</button>
      <button type="button" (click)="closeDialog()">Close export dialog</button>
    </app-toolbar>
    <upmade-editor
      editorId="export-dialog"
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
      (isReady)="onReady()"
    ></upmade-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    upmade-editor { flex: 1; }
  `,
})
export class ExportDialogComponent {
  @ViewChild(UpmadeEditor) editor!: UpmadeEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpmadeWorkspace({ objects: createSeedObjects() })]);

  async onReady(): Promise<void> {
    setTimeout(async () => await this.openDialog(), 100); // Ensure the dialog opens after seed objects are created
  }

  async openDialog(): Promise<void> {
    await this.editor.openExportDialog();
  }

  async closeDialog(): Promise<void> {
    await this.editor.closeExportDialog();
  }
}