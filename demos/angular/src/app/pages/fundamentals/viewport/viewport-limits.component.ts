import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-limits',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="zoomIn()">Zoom In</button>
      <button (click)="zoomOut()">Zoom Out</button>
    </app-toolbar>

    <kritzel-editor
      editorId="viewport-limits"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [scaleMin]="0.5"
      [scaleMax]="2"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    kritzel-editor { flex: 1; }
  `],
})
export class ViewportLimitsComponent {
  private readonly zoomFactor = 1.1;

  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  async zoomIn() {
    await this.editor.zoomIn(this.zoomFactor, 200);
  }

  async zoomOut() {
    await this.editor.zoomOut(this.zoomFactor, 200);
  }

}