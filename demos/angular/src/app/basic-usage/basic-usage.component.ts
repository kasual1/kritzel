import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import {
  InMemorySyncProvider,
  KritzelBaseObject,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelText,
} from 'kritzel-angular';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';
import { createSeedObjects } from '../const/seed-objects';

@Component({
  selector: 'app-basic-usage',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="toolbar">
      <button
        [class.active]="activeTool() === 'brush'"
        (click)="setBrushTool()"
      >
        Brush
      </button>
      <button
        [class.active]="activeTool() === 'select'"
        (click)="setSelectTool()"
      >
        Select
      </button>
      <button (click)="addText()">Add Text</button>
      <button (click)="undoAction()">Undo</button>
      <button (click)="zoomIn()">Zoom In</button>
      <span class="status">{{ statusLine() }}</span>
    </header>

    <kritzel-editor
      editorId="basic-usage"
      #editor
      [wheelEnabled]="false"
      [syncConfig]="syncConfig"
      [theme]="'angular-theme'"
      [themes]="themes"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isControlsVisible]="false"
      (isReady)="onReady()"
      (objectsChange)="onObjectsChange($event)"
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
        background: #fafafa;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding: 8px 12px;
        border-bottom: 1px solid #ebebeb;
        background: #f5f5f5;
      }

      button {
        padding: 6px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        background: #ffffff;
        color: #333333;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      button:hover {
        background: #dd0031;
        color: #ffffff;
        border-color: #dd0031;
      }

      button.active {
        background: #dd0031;
        color: #ffffff;
        border-color: #dd0031;
      }

      .status {
        margin-left: auto;
        font-size: 12px;
        color: #555555;
        font-weight: 500;
        white-space: nowrap;
      }

      kritzel-editor {
        flex: 1;
        min-height: 0;
        display: block;
      }
    `,
  ],
})
export class BasicUsageComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  themes = [angularThemeLight, angularThemeDark];

  isReady = signal<boolean>(false);
  activeTool = signal<'brush' | 'select'>('select');
  objectsCount = signal<number>(0);

  statusLine = computed(() => {
    if (!this.isReady()) {
      return 'Loading editor...';
    }

    return `Objects: ${this.objectsCount()} | Tool: ${this.activeTool()}`;
  });

  async onReady() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    this.isReady.set(true);
  }

  onObjectsChange(
    event: CustomEvent<KritzelBaseObject<HTMLElement | SVGElement>[]>,
  ) {
    this.objectsCount.set(event.detail.length);
  }

  async setBrushTool() {
    this.activeTool.set('brush');
    await this.editor.changeActiveToolByName('brush');
  }

  async setSelectTool() {
    this.activeTool.set('select');
    await this.editor.changeActiveToolByName('select');
  }

  async addText() {
    const text = new KritzelText({
      text: 'Programmatic text!',
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: 'Arial',
      fontColor: { light: '#ff0000', dark: '#ff4d6d' },
    });

    await this.editor.addObject(text);
    await this.editor.selectObjects([text]);
  }

  async undoAction() {
    await this.editor.undo();
  }

  async zoomIn() {
    await this.editor.zoomTo(1.5);
  }
}
