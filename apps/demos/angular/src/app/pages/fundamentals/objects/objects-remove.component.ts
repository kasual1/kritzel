import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  KritzelBaseObject,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-objects-remove',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="removeLastObject()" [disabled]="objects().length === 0">
        Remove Object
      </button>
    </app-toolbar>
    <kritzel-editor
      editorId="objects-remove"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
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
      kritzel-editor {
        flex: 1;
      }
    `,
  ],
})
export class ObjectsRemoveComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  private readonly seedObjects = createSeedObjects();

  workspaces = signal([new KritzelWorkspace({ objects: this.seedObjects })]);

  objects = signal<KritzelBaseObject[]>(this.seedObjects);

  async removeLastObject() {
    const all = await this.editor.getAllObjects();
    if (all.length > 0) {
      await this.editor.removeObject(all[all.length - 1]);
      this.objects.set(await this.editor.getAllObjects());
    }
  }
}