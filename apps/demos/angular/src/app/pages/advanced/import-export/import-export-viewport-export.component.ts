import { Component, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-import-export-viewport-export',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="exportAsPng()">Export as PNG</button>
      <button (click)="exportAsSvg()">Export as SVG</button>
    </app-toolbar>
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
