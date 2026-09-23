import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, KritzelViewportState, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-events',
  imports: [KritzelEditor, DecimalPipe, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="panUp()">Pan Up</button>
      <button (click)="panDown()">Pan Down</button>
      <button (click)="panLeft()">Pan Left</button>
      <button (click)="panRight()">Pan Right</button>
      <button (click)="zoomIn()">Zoom In</button>
      <button (click)="zoomOut()">Zoom Out</button>
      <span class="status">X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}</span>
      <span class="status">Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}</span>
      <span class="status">Scale: {{ viewport()?.scale ?? 1 | number:'1.0-2' }}</span>
    </app-toolbar>

    <kritzel-editor
      editorId="viewport-events"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    kritzel-editor { flex: 1; }
  `],
})
export class ViewportEventsComponent {
  private readonly panStep = 100;
  private readonly zoomFactor = 1.1;

  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);
  viewport = signal<KritzelViewportState | null>(null);

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

  async zoomIn() {
    await this.editor.zoomIn(this.zoomFactor, 200);
  }

  async zoomOut() {
    await this.editor.zoomOut(this.zoomFactor, 200);
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

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }

}