import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  IndexedDBSyncProvider,
  KritzelBaseObject,
  KritzelSyncConfig,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import {
  InfoPanelComponent,
  InfoPanelToggleComponent,
} from '../../../components/info-panel.component';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-objects-selection',
  imports: [KritzelEditor, InfoPanelComponent, InfoPanelToggleComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="selectAll()">Select All</button>
      <button (click)="selectFirst()">Select Object</button>
      <button (click)="clearSelection()">Clear Selection</button>
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>
    <div class="content">
      <kritzel-editor
        editorId="objects-selection"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (objectsSelectionChange)="refreshSelection()"
      ></kritzel-editor>
      <app-info-panel #infoPanel [hasToolbarToggle]="true">
        <h3>Objects</h3>
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
      </app-info-panel>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .content { display: flex; flex: 1; min-height: 0; position: relative; }
    kritzel-editor { flex: 1; }
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

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  syncConfig: KritzelSyncConfig = {
    providers: [IndexedDBSyncProvider],
    

  };

  selectedObjects = signal<KritzelBaseObject[]>([]);

  async selectAll() {
    const all = await this.editor.getAllObjects();
    await this.editor.selectObjects(all);
  }

  async selectFirst() {
    const all = await this.editor.getAllObjects();
    if (all.length > 0) {
      await this.editor.selectObjects([all[0]]);
    }
  }

  async clearSelection() {
    await this.editor.clearSelection();
  }

  async refreshSelection() {
    const selected = await this.editor.getSelectedObjects();
    this.selectedObjects.set(selected);
  }
}
