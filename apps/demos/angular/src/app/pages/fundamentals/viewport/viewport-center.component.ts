import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  UpmadeEditor,
  UpmadeBaseObject,
  UpmadeWorkspace,
} from '@upmade/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-viewport-center',
  imports: [UpmadeEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="centerOn(1)" [disabled]="objects().length < 2">Center on Ellipsis</button>
      <button (click)="centerOn(0)" [disabled]="objects().length === 0">Center on Rectangle</button>
      <button (click)="centerOn(2)" [disabled]="objects().length < 3">Center on Line</button>
      <button (click)="centerOn(3)" [disabled]="objects().length < 4">Center on Path</button>
      <button (click)="backToContent()">Back to Content</button>
    </app-toolbar>
    <upmade-editor
      editorId="viewport-center"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></upmade-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    upmade-editor { flex: 1; }
  `],
})
export class ViewportCenterComponent {
  @ViewChild(UpmadeEditor) editor!: UpmadeEditor;

  themes = [angularThemeLight, angularThemeDark];

  private readonly seedObjects = createSeedObjects();

  workspaces = signal([new UpmadeWorkspace({ objects: this.seedObjects })]);

  objects = signal<UpmadeBaseObject[]>(this.seedObjects);

  async centerOn(index: number) {
    const all = this.objects();
    if (all[index]) {
      await this.editor.centerObjects([all[index]]);
    }
  }

  async backToContent() {
    await this.editor.backToContent();
  }
}
