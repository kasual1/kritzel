import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { UpmadeEditor, UpmadeWorkspace } from '@upmade/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-pan',
  imports: [UpmadeEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="panToOrigin()">Pan to Origin</button>
      <button (click)="panToOffset()">Pan to (200, 150)</button>
      <button (click)="setViewportCenter()">Center on (100, 100)</button>
    </app-toolbar>
    <upmade-editor
      editorId="viewport-pan"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></upmade-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    upmade-editor { flex: 1; }
  `],
})
export class ViewportPanComponent {
  @ViewChild(UpmadeEditor) editor!: UpmadeEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpmadeWorkspace({ objects: createSeedObjects() })]);

  async panToOrigin() {
    await this.editor.panTo(0, 0);
  }

  async panToOffset() {
    await this.editor.panTo(200, 150);
  }

  async setViewportCenter() {
    const currentViewport = await this.editor.getViewport();
    await this.editor.setViewport(100, 100, currentViewport.scale);
  }

}