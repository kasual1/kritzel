import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { UpdrawEditor, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-zoom',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="zoomIn()">Zoom In</button>
      <button (click)="zoomOut()">Zoom Out</button>
      <button (click)="zoomToScale()">Zoom to 150%</button>
      <button (click)="zoomToPoint()">Zoom at (200, 150)</button>
    </app-toolbar>
    <updraw-editor
      editorId="viewport-zoom"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></updraw-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    updraw-editor { flex: 1; }
  `],
})
export class ViewportZoomComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  async zoomIn() {
    await this.editor.zoomIn();
  }

  async zoomOut() {
    await this.editor.zoomOut();
  }

  async zoomToScale() {
    await this.editor.zoomTo(1.5);
  }

  async zoomToPoint() {
    await this.editor.zoomTo(2, 200, 150);
  }

}