import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  KritzelBaseObject,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-export-dialog',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button type="button" (click)="openDialog()">Open export dialog</button>
      <button type="button" (click)="closeDialog()">Close export dialog</button>
    </app-toolbar>
    <kritzel-editor
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
      (objectsChange)="onObjectsChange($event)"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    kritzel-editor { flex: 1; }
  `,
})
export class ExportDialogComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  private hasOpenedDialog = false;

  async onObjectsChange(event: CustomEvent<KritzelBaseObject[]>): Promise<void> {
    if (this.hasOpenedDialog || event.detail.length === 0) return;

    this.hasOpenedDialog = true;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await this.openDialog();
  }

  async openDialog(): Promise<void> {
    await this.editor.openExportDialog();
  }

  async closeDialog(): Promise<void> {
    await this.editor.closeExportDialog();
  }
}