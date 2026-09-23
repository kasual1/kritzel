import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-quickstart',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="quickstart"
      [theme]="'angular-theme-light'"
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
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class QuickStartComponent {
  themes = [angularThemeLight];
  workspaces = signal([
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);
}
