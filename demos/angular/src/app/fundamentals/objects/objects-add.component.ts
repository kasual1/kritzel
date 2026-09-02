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
  KritzelShape,
  KritzelPath,
  ShapeType,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-objects-add',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar class="toolbar">
      <button (click)="addRectangle()">Add Rectangle</button>
      <button (click)="addEllipse()">Add Ellipse</button>
      <button (click)="addPath()">Add Path</button>
    </app-toolbar>
    <kritzel-editor
      editorId="objects-add"
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
      kritzel-editor {
        flex: 1;
      }
    `,
  ],
})
export class ObjectsAddComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  objects = signal<KritzelBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    this.objects.set(await this.editor.getAllObjects());
  }

  async addRectangle() {
    const shape = new KritzelShape({
      translateX: this.randomOffset(),
      translateY: this.randomOffset(),
      width: 120,
      height: 80,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#e3f2fd', dark: '#1a237e' },
      strokeColor: { light: '#1565c0', dark: '#90caf9' },
      strokeWidth: 3,
    });
    await this.editor.addObject(shape);
    this.objects.set(await this.editor.getAllObjects());
  }

  async addEllipse() {
    const shape = new KritzelShape({
      translateX: this.randomOffset(),
      translateY: this.randomOffset(),
      width: 100,
      height: 100,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#fce4ec', dark: '#880e4f' },
      strokeColor: { light: '#c62828', dark: '#ef9a9a' },
      strokeWidth: 3,
    });
    await this.editor.addObject(shape);
    this.objects.set(await this.editor.getAllObjects());
  }

  async addPath() {
    const path = new KritzelPath({
      points: [
        [0, 0, 0.5],
        [20, -15, 0.5],
        [40, -30, 0.5],
        [60, -20, 0.5],
        [80, -10, 0.5],
        [100, -25, 0.5],
        [120, -40, 0.5],
      ],
      translateX: this.randomOffset(),
      translateY: this.randomOffset(),
      strokeWidth: 6,
      fill: { light: '#ff9800', dark: '#ffb74d' },
    });
    await this.editor.addObject(path);
    this.objects.set(await this.editor.getAllObjects());
  }

  private randomOffset(): number {
    return Math.floor(Math.random() * 200) - 100;
  }
}