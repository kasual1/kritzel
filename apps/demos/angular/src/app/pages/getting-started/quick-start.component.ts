import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { UpdrawEditor, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-quickstart',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <updraw-editor
      editorId="quickstart"
      [theme]="'angular-theme-light'"
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
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class QuickStartComponent {
  themes = [angularThemeLight];
  workspaces = signal([
    new UpdrawWorkspace({ objects: createSeedObjects() }),
  ]);
}
