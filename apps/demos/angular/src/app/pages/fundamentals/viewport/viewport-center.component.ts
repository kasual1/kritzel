import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  KritzelBaseObject,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-center',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="centerOn(1)" [disabled]="objects().length < 2">Center on Ellipsis</button>
      <button (click)="centerOn(0)" [disabled]="objects().length === 0">Center on Rectangle</button>
      <button (click)="centerOn(2)" [disabled]="objects().length < 3">Center on Line</button>
      <button (click)="centerOn(3)" [disabled]="objects().length < 4">Center on Path</button>
      <button (click)="backToContent()">Back to Content</button>
    </app-toolbar>
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
