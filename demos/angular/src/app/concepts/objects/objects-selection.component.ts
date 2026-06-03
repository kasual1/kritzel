import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  InMemorySyncProvider,
  KritzelBaseObject,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-objects-selection',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="selectAll()">Select All</button>
      <button (click)="selectFirst()">Select First</button>
      <button (click)="clearSelection()">Clear Selection</button>
      <button (click)="refreshSelection()">Get Selected</button>
      <span class="count">Selected: {{ selectedObjects().length }}</span>
    </div>
    <div class="content">
      <kritzel-editor
        editorId="objects-selection"
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
        <h3>Selected</h3>
        <ul>
          @for (obj of selectedObjects(); track obj.id) {
            <li>
              <span class="type">{{ obj.__class__ }}</span>
              <span class="id">{{ obj.id.slice(0, 8) }}</span>
            </li>
          }
          @empty {
            <li class="empty">Nothing selected</li>
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
export class ObjectsSelectionComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  selectedObjects = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }
    }
  }

  async selectAll() {
    const all = await this.editor.getAllObjects();
    await this.editor.selectObjects(all);
    await this.refreshSelection();
  }

  async selectFirst() {
    const all = await this.editor.getAllObjects();
    if (all.length > 0) {
      await this.editor.selectObjects([all[0]]);
      await this.refreshSelection();
    }
  }

  async clearSelection() {
    await this.editor.clearSelection();
    await this.refreshSelection();
  }

  async refreshSelection() {
    const selected = await this.editor.getSelectedObjects();
    this.selectedObjects.set(selected);
  }
}
