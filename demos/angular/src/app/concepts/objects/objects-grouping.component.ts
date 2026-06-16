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
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-objects-grouping',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="selectAll()">Select All</button>
      <button (click)="groupSelected()">Group</button>
      <button (click)="ungroupSelected()">Ungroup</button>
    </div>
    <div class="content">
      <kritzel-editor
        editorId="objects-grouping"
        [theme]="'angular-theme'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
      ></kritzel-editor>
      <aside>
        <h3>Objects</h3>
        <ul>
          @for (obj of objects(); track obj.id) {
            <li>
              <span class="type">{{ obj.__class__ }}</span>
            </li>
          }
        </ul>
      </aside>
    </div>
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
        flex-wrap: wrap;
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
      .separator {
        width: 1px;
        height: 20px;
        background: #ddd;
      }
      .content {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      kritzel-editor {
        flex: 1;
      }
      aside {
        width: 180px;
        overflow-y: auto;
        padding: 8px;
        border-left: 1px solid #ebebeb;
        font-size: 13px;
      }
      aside h3 {
        margin: 0 0 8px;
        font-size: 14px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        padding: 4px 0;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
      }
      .type {
        color: #333;
        font-weight: 500;
      }
      .z {
        color: #999;
        font-family: monospace;
        font-size: 11px;
      }
    `,
  ],
})
export class ObjectsGroupingComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  objects = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    await this.refreshObjects();
  }

  async selectAll() {
    const all = await this.editor.getAllObjects();
    await this.editor.selectObjects(all);
  }

  async groupSelected() {
    await this.editor.group();
    await this.refreshObjects();
  }

  async ungroupSelected() {
    await this.editor.ungroup();
    await this.refreshObjects();
  }

  private async refreshObjects() {
    const all = await this.editor.getAllObjects();
    this.objects.set([...all].sort((a, b) => a.zIndex - b.zIndex));
  }
}
