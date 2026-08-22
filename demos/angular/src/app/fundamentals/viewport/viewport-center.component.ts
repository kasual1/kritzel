import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  KritzelBaseObject,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-viewport-center',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="centerOn(1)" [disabled]="objects().length < 2">Center on Ellipsis</button>
      <button (click)="centerOn(0)" [disabled]="objects().length === 0">Center on Rectangle</button>
      <button (click)="centerOn(2)" [disabled]="objects().length < 3">Center on Line</button>
      <button (click)="centerOn(3)" [disabled]="objects().length < 4">Center on Path</button>
      <button (click)="backToContent()">Back to Content</button>
    </div>
    <kritzel-editor
      editorId="viewport-center"
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
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .toolbar button:disabled:hover { background: #fff; color: inherit; border-color: #ccc; }
    kritzel-editor { flex: 1; }
  `],
})
export class ViewportCenterComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  objects = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
    this.objects.set(await this.editor.getAllObjects());
  }

  async centerOn(index: number) {
    const all = this.objects();
    if (all[index]) {
      await this.editor.centerObjects([all[index]]);
    }
  }

  async backToContent() {
    await this.editor.backToContent();
  }
}
