import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-boundaries',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="panUp()">Pan Up</button>
      <button (click)="panDown()">Pan Down</button>
      <button (click)="panLeft()">Pan Left</button>
      <button (click)="panRight()">Pan Right</button>
    </app-toolbar>

    <kritzel-editor
      editorId="viewport-boundaries"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [viewportBoundaryLeft]="-500"
      [viewportBoundaryRight]="500"
      [viewportBoundaryTop]="-400"
      [viewportBoundaryBottom]="400"
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
export class ViewportBoundariesComponent {
  private readonly panStep = 100;

  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  async panUp() {
    await this.panBy(0, -this.panStep);
  }

  async panDown() {
    await this.panBy(0, this.panStep);
  }

  async panLeft() {
    await this.panBy(-this.panStep, 0);
  }

  async panRight() {
    await this.panBy(this.panStep, 0);
  }

  private async panBy(offsetX: number, offsetY: number) {
    const currentViewport = await this.editor.getViewport();
    const centerWorldX = (currentViewport.width / 2 - currentViewport.translateX) / currentViewport.scale;
    const centerWorldY = (currentViewport.height / 2 - currentViewport.translateY) / currentViewport.scale;
    await this.editor.setViewport(
      centerWorldX + offsetX,
      centerWorldY + offsetY,
      currentViewport.scale,
    );
  }

}