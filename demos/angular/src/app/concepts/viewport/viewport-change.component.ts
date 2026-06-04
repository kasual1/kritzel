import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, EditorIsReadyEvent, KritzelViewportState, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-viewport-change',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="panToOrigin()">Pan to Origin</button>
      <button (click)="panToOffset()">Pan to (200, 150)</button>
      <button (click)="zoomIn()">Zoom In</button>
      <button (click)="zoomOut()">Zoom Out</button>
      <button (click)="setFullViewport()">Set (100, 100, 0.5)</button>
    </div>
    <kritzel-editor
      editorId="viewport-change"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <div class="status-bar">
      <span>Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }}%</span>
      <span>X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}</span>
      <span>Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}</span>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    kritzel-editor { flex: 1; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; font-family: monospace; }
  `],
})
export class ViewportChangeComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  viewport = signal<KritzelViewportState | null>(null);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  async panToOrigin() {
    await this.editor.panTo(0, 0);
  }

  async panToOffset() {
    await this.editor.panTo(200, 150);
  }

  async zoomIn() {
    const current = this.viewport()?.scale ?? 1;
    await this.editor.zoomTo(Math.min(current * 1.5, 5));
  }

  async zoomOut() {
    const current = this.viewport()?.scale ?? 1;
    await this.editor.zoomTo(Math.max(current / 1.5, 0.1));
  }

  async setFullViewport() {
    await this.editor.setViewport(100, 100, 0.5);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
