import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  KritzelBaseObject,
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
  selector: 'app-objects-update',
  imports: [KritzelEditor, DecimalPipe, InfoPanelComponent, InfoPanelToggleComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="selectFirst()">Select Object</button>
      <span class="separator"></span>
      <button (click)="moveRight()" [disabled]="selectionCount() !== 1">Move Right</button>
      <button (click)="rotate()" [disabled]="selectionCount() !== 1">Rotate 15°</button>
      <button (click)="toggleOpacity()" [disabled]="selectionCount() !== 1">Toggle Opacity</button>
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>
    <div class="content">
      <kritzel-editor
        editorId="objects-update"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
        (objectsSelectionChange)="onSelectionChange()"
      ></kritzel-editor>
      <app-info-panel #infoPanel [hasToolbarToggle]="true">
        <h3>Object</h3>
        @if (selected(); as obj) {
          <ul>
            <li><span class="label">translateX</span><span class="value">{{ obj.translateX | number: '1.0-0' }}</span></li>
            <li><span class="label">translateY</span><span class="value">{{ obj.translateY | number: '1.0-0' }}</span></li>
            <li><span class="label">rotation</span><span class="value">{{ obj.rotation | number: '1.0-0' }}</span></li>
            <li><span class="label">opacity</span><span class="value">{{ obj.opacity | number: '1.1-1' }}</span></li>
          </ul>
        } @else {
          <p class="empty">Nothing selected</p>
        }
      </app-info-panel>
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
      .content {
        display: flex;
        flex: 1;
        min-height: 0;
        position: relative;
      }
      kritzel-editor {
        flex: 1;
      }
      app-info-panel {
        --demo-info-panel-width: 180px;
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
      .label {
        color: #333;
        font-weight: 500;
      }
      .value {
        color: #999;
        font-family: monospace;
        font-size: 11px;
      }
      .empty {
        color: #999;
        font-style: italic;
      }
    `,
  ],
})
export class ObjectsUpdateComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  selected = signal<KritzelBaseObject | null>(null);
  selectionCount = signal(0);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.onSelectionChange();
  }

  async selectFirst() {
    const all = await this.editor.getAllObjects();
    if (all.length > 0) {
      await this.editor.selectObjects([all[0]]);
    }
  }

  async onSelectionChange() {
    const selected = await this.editor.getSelectedObjects();
    this.selected.set(selected[0] ?? null);
    this.selectionCount.set(selected.length);
  }

  async moveRight() {
    const obj = this.selected();
    if (!obj) return;
    const updated = await this.editor.updateObject(obj, {
      translateX: obj.translateX + 40,
    });
    if (updated) {
      await this.editor.selectObjects([updated]);
    }
  }

  async rotate() {
    const obj = this.selected();
    if (!obj) return;
    const updated = await this.editor.updateObject(obj, {
      rotation: (obj.rotation + 15) % 360,
    });
    if (updated) {
      await this.editor.selectObjects([updated]);
    }
  }

  async toggleOpacity() {
    const obj = this.selected();
    if (!obj) return;
    const updated = await this.editor.updateObject(obj, {
      opacity: obj.opacity === 1 ? 0.4 : 1,
    });
    if (updated) {
      await this.editor.selectObjects([updated]);
    }
  }
}
