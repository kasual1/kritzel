import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  UpdrawEditor,
  EditorIsReadyEvent,
  UpdrawBaseObject,
  UpdrawShape,
  UpdrawPath,
  UpdrawWorkspace,
  ShapeType,
} from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-objects-add',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="addRectangle()">Add Rectangle</button>
      <button (click)="addEllipse()">Add Ellipse</button>
      <button (click)="addPath()">Add Path</button>
    </app-toolbar>
    <updraw-editor
      editorId="objects-add"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
    ></updraw-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      updraw-editor {
        flex: 1;
      }
    `,
  ],
})
export class ObjectsAddComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  objects = signal<UpdrawBaseObject[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    this.objects.set(await this.editor.getAllObjects());
  }

  async addRectangle() {
    const shape = new UpdrawShape({
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
    const shape = new UpdrawShape({
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
    const path = new UpdrawPath({
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