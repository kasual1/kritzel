import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { KritzelEditor } from '@kritzel/angular-editor';
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
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isToolbarVisible]="false"
      [isUtilityPanelVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isMoreMenuVisible]="false"
      [isZoomPanelVisible]="false"
      (isReady)="onReady()"
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

  async onReady(): Promise<void> {
    for (const object of createSeedObjects()) {
      await this.editor()?.addObject(object);
    }
  }

  async openDialog(): Promise<void> {
    await this.editor()?.openImportDialog();
  }
}