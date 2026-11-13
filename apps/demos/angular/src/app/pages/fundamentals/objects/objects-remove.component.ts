import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  UpdrawEditor,
  UpdrawBaseObject,
  UpdrawWorkspace,
} from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-objects-remove',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="removeLastObject()" [disabled]="objects().length === 0">
        Remove Object
      </button>
    </app-toolbar>
    <updraw-editor
      editorId="objects-remove"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
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
export class ObjectsRemoveComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];

  private readonly seedObjects = createSeedObjects();

  workspaces = signal([new UpdrawWorkspace({ objects: this.seedObjects })]);

  objects = signal<UpdrawBaseObject[]>(this.seedObjects);

  async removeLastObject() {
    const all = await this.editor.getAllObjects();
    if (all.length > 0) {
      await this.editor.removeObject(all[all.length - 1]);
      this.objects.set(await this.editor.getAllObjects());
    }
  }
}