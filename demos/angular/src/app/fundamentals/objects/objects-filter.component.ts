import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  KritzelBaseObject,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';
import {
  InfoPanelComponent,
  InfoPanelToggleComponent,
} from '../../components/info-panel.component';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-objects-filter',
  imports: [KritzelEditor, InfoPanelComponent, InfoPanelToggleComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="queryAll()">Get All</button>
      <button (click)="queryByType('KritzelShape')">Filter Shapes</button>
      <button (click)="queryByType('KritzelPath')">Filter Paths</button>
      <button (click)="queryByType('KritzelLine')">Filter Lines</button>
      <button (click)="queryInViewport()">In Viewport</button>
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>
    <div class="content">
      <kritzel-editor
        editorId="objects-filter"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
      ></kritzel-editor>
      <app-info-panel #infoPanel [hasToolbarToggle]="true">
        <h3>Objects</h3>
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
export class ObjectsFilterComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  results = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }
    }
  }

  async queryAll() {
    const all = await this.editor.getAllObjects();
    this.results.set(all);
  }

  async queryByType(className: string) {
    const filtered = await this.editor.findObjects(
      obj => obj.__class__ === className
    );
    this.results.set(filtered);
  }

  async queryInViewport() {
    const visible = await this.editor.getObjectsInViewport();
    this.results.set(visible);
  }
}