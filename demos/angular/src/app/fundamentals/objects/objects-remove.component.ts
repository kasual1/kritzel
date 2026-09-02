import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  KritzelBaseObject,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-objects-remove',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar class="toolbar">
      <button (click)="removeLastObject()" [disabled]="objects().length === 0">
        Remove Object
      </button>
    </app-toolbar>
    <kritzel-editor
      editorId="objects-remove"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #ebebeb;
      }
      .toolbar button {
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
      }
      .toolbar button:hover {
        background: #dd0031;
        color: #fff;
        border-color: #dd0031;
      }
      .toolbar button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .toolbar button:disabled:hover {
        background: #fff;
        color: inherit;
        border-color: #ccc;
      }
      kritzel-editor {
        flex: 1;
      }
    `,
  ],
})
export class ObjectsRemoveComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  objects = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    this.objects.set(await this.editor.getAllObjects());
  }

  async removeLastObject() {
    const all = await this.editor.getAllObjects();
    if (all.length > 0) {
      await this.editor.removeObject(all[all.length - 1]);
      this.objects.set(await this.editor.getAllObjects());
    }
  }
}