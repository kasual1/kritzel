import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, EditorIsReadyEvent, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-viewport-coordinates',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Screen → World</span>
      <input #screenX type="number" placeholder="screenX" value="200" />
      <input #screenY type="number" placeholder="screenY" value="150" />
      <button (click)="convertScreenToWorld(+screenX.value, +screenY.value)">Convert</button>
      <span class="result">
        @if (worldCoords()) {
          World: ({{ worldCoords()!.x | number:'1.1-1' }}, {{ worldCoords()!.y | number:'1.1-1' }})
        }
      </span>
    </div>
    <div class="toolbar">
      <span class="label">World → Screen</span>
      <input #worldX type="number" placeholder="worldX" value="0" />
      <input #worldY type="number" placeholder="worldY" value="0" />
      <button (click)="convertWorldToScreen(+worldX.value, +worldY.value)">Convert</button>
      <span class="result">
        @if (screenCoords()) {
          Screen: ({{ screenCoords()!.x | number:'1.1-1' }}, {{ screenCoords()!.y | number:'1.1-1' }})
        }
      </span>
    </div>
    <kritzel-editor
      editorId="viewport-coordinates"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
    .toolbar .label { font-size: 13px; font-weight: 500; color: #333; min-width: 100px; }
    .toolbar input { width: 70px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .toolbar .result { font-size: 13px; font-family: monospace; color: #333; margin-left: auto; }
    kritzel-editor { flex: 1; }
  `],
})
export class ViewportCoordinatesComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  worldCoords = signal<{ x: number; y: number } | null>(null);
  screenCoords = signal<{ x: number; y: number } | null>(null);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  async convertScreenToWorld(screenX: number, screenY: number) {
    const result = await this.editor.screenToWorld(screenX, screenY);
    this.worldCoords.set(result);
  }

  async convertWorldToScreen(worldX: number, worldY: number) {
    const result = await this.editor.worldToScreen(worldX, worldY);
    this.screenCoords.set(result);
  }
}
