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
  selector: 'app-objects-query',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="queryAll()">Get All</button>
      <button (click)="queryByType('KritzelShape')">Filter Shapes</button>
      <button (click)="queryByType('KritzelPath')">Filter Paths</button>
      <button (click)="queryByType('KritzelLine')">Filter Lines</button>
      <button (click)="queryInViewport()">In Viewport</button>
      <span class="count">Total: {{ totalCount() }}</span>
    </div>
    <div class="content">
      <kritzel-editor
        editorId="objects-query"
        [wheelEnabled]="false"
        [theme]="'angular-theme'"
        [themes]="themes"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
      ></kritzel-editor>
      <aside>
        <h3>Results ({{ results().length }})</h3>
        <ul>
          @for (obj of results(); track obj.id) {
            <li>
              <span class="type">{{ obj.__class__ }}</span>
              <span class="id">{{ obj.id.slice(0, 8) }}</span>
            </li>
          }
          @empty {
            <li class="empty">No results</li>
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
    .count { margin-left: auto; font-size: 13px; color: #333; }
    .content { display: flex; flex: 1; min-height: 0; }
    kritzel-editor { flex: 1; }
    aside { width: 200px; overflow-y: auto; padding: 8px; border-left: 1px solid #ebebeb; font-size: 13px; }
    aside h3 { margin: 0 0 8px; font-size: 14px; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { padding: 4px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    .type { color: #333; font-weight: 500; }
    .id { color: #999; font-family: monospace; font-size: 11px; }
    .empty { color: #999; font-style: italic; }
  `],
})
export class ObjectsQueryComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  results = signal<KritzelBaseObject[]>([]);
  totalCount = signal(0);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }
    }
    await this.queryAll();
  }

  async queryAll() {
    const all = await this.editor.getAllObjects();
    this.results.set(all);
    this.totalCount.set(await this.editor.getObjectsTotalCount());
  }

  async queryByType(className: string) {
    const filtered = await this.editor.findObjects(
      obj => obj.__class__ === className
    );
    this.results.set(filtered);
    this.totalCount.set(await this.editor.getObjectsTotalCount());
  }

  async queryInViewport() {
    const visible = await this.editor.getObjectsInViewport();
    this.results.set(visible);
    this.totalCount.set(await this.editor.getObjectsTotalCount());
  }
}
