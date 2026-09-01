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
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-objects-update',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="selectFirst()">Select First Object</button>
      <span class="separator"></span>
      <button (click)="moveRight()" [disabled]="selectionCount() !== 1">Move Right</button>
      <button (click)="rotate()" [disabled]="selectionCount() !== 1">Rotate 15°</button>
      <button (click)="toggleOpacity()" [disabled]="selectionCount() !== 1">Toggle Opacity</button>
    </div>
    <div class="content">
      <kritzel-editor
        editorId="objects-update"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady($event)"
        (objectsSelectionChange)="onSelectionChange()"
      ></kritzel-editor>
      <aside>
        <h3>Selected Object</h3>
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
      .toolbar button:hover:not(:disabled) {
        background: #dd0031;
        color: #fff;
        border-color: #dd0031;
      }
      .toolbar button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

  selected = signal<KritzelBaseObject | null>(null);
  selectionCount = signal(0);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }
    }
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
