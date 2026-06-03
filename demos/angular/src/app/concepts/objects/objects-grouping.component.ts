import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  InMemorySyncProvider,
  KritzelBaseObject,
  KritzelShape,
  KritzelSyncConfig,
  ShapeType,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';

@Component({
  selector: 'app-objects-grouping',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="selectAll()">Select All</button>
      <button (click)="groupSelected()">Group</button>
      <button (click)="ungroupSelected()">Ungroup</button>
      <span class="separator"></span>
      <button (click)="bringToFront()">Bring to Front</button>
      <button (click)="bringForward()">Bring Forward</button>
      <button (click)="sendBackward()">Send Backward</button>
      <button (click)="sendToBack()">Send to Back</button>
    </div>
    <div class="content">
      <kritzel-editor
        editorId="objects-grouping"
        [wheelEnabled]="false"
        [theme]="'angular-theme'"
        [themes]="themes"
        [syncConfig]="syncConfig"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
      ></kritzel-editor>
      <aside>
        <h3>Objects (z-order)</h3>
        <ul>
          @for (obj of objects(); track obj.id) {
            <li>
              <span class="type">{{ obj.__class__ }}</span>
              <span class="z">z:{{ obj.zIndex }}</span>
            </li>
          }
        </ul>
      </aside>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .separator { width: 1px; height: 20px; background: #ddd; }
    .content { display: flex; flex: 1; min-height: 0; }
    kritzel-editor { flex: 1; }
    aside { width: 180px; overflow-y: auto; padding: 8px; border-left: 1px solid #ebebeb; font-size: 13px; }
    aside h3 { margin: 0 0 8px; font-size: 14px; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { padding: 4px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    .type { color: #333; font-weight: 500; }
    .z { color: #999; font-family: monospace; font-size: 11px; }
  `],
})
export class ObjectsGroupingComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  objects = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedShapes();
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

  async bringToFront() {
    await this.editor.bringToFront();
    await this.refreshObjects();
  }

  async bringForward() {
    await this.editor.bringForward();
    await this.refreshObjects();
  }

  async sendBackward() {
    await this.editor.sendBackward();
    await this.refreshObjects();
  }

  async sendToBack() {
    await this.editor.sendToBack();
    await this.refreshObjects();
  }

  private async refreshObjects() {
    const all = await this.editor.getAllObjects();
    this.objects.set([...all].sort((a, b) => a.zIndex - b.zIndex));
  }

  private async seedShapes() {
    const shapes = [
      new KritzelShape({
        translateX: -120, translateY: -80, width: 100, height: 100,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#e3f2fd', dark: '#1a237e' },
        strokeColor: { light: '#1565c0', dark: '#90caf9' },
        strokeWidth: 3,
      }),
      new KritzelShape({
        translateX: -40, translateY: -60, width: 100, height: 100,
        shapeType: ShapeType.Ellipse,
        fillColor: { light: '#fce4ec', dark: '#880e4f' },
        strokeColor: { light: '#c62828', dark: '#ef9a9a' },
        strokeWidth: 3,
      }),
      new KritzelShape({
        translateX: 40, translateY: -80, width: 100, height: 100,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#e8f5e9', dark: '#1b5e20' },
        strokeColor: { light: '#2e7d32', dark: '#a5d6a7' },
        strokeWidth: 3,
      }),
    ];
    for (const shape of shapes) {
      await this.editor.addObject(shape);
    }
  }
}
