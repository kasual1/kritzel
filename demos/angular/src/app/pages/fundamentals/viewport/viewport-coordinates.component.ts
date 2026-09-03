import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, EditorIsReadyEvent, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-coordinates',
  imports: [KritzelEditor, DecimalPipe, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Screen → World</span>
      <input #screenX type="number" placeholder="screenX" value="200" />
      <input #screenY type="number" placeholder="screenY" value="150" />
      <button (click)="convertScreenToWorld(+screenX.value, +screenY.value)">Convert</button>
      <span class="result">
        @if (worldCoords()) {
          World: ({{ worldCoords()!.x | number:'1.1-1' }}, {{ worldCoords()!.y | number:'1.1-1' }})
        }
      </span>
    </app-toolbar>
    <app-toolbar>
      <span class="label">World → Screen</span>
      <input #worldX type="number" placeholder="worldX" value="0" />
      <input #worldY type="number" placeholder="worldY" value="0" />
      <button (click)="convertWorldToScreen(+worldX.value, +worldY.value)">Convert</button>
      <span class="result">
        @if (screenCoords()) {
          Screen: ({{ screenCoords()!.x | number:'1.1-1' }}, {{ screenCoords()!.y | number:'1.1-1' }})
        }
      </span>
    </app-toolbar>
    <kritzel-editor
      editorId="viewport-coordinates"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    app-toolbar > .label { min-width: 100px; }
    app-toolbar > .result { margin-left: auto; }
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
