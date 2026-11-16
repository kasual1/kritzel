import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { UpmadeEditor, UpmadeTheme, UpmadeWorkspace } from '@upmade/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-theming-apply',
  imports: [UpmadeEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button
        [class.active]="activeName === 'light'"
        (click)="activeName = 'light'"
      >
        Light
      </button>
      <button
        [class.active]="activeName === 'dark'"
        (click)="activeName = 'dark'"
      >
        Dark
      </button>
    </app-toolbar>
    <div class="editor-wrap">
      <upmade-editor
        editorId="theming-apply"
        [theme]="activeName"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="true"
      ></upmade-editor>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class ThemingApplyComponent {
  themes: UpmadeTheme[] = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpmadeWorkspace({ objects: createSeedObjects() })]);

  activeName: string = 'light';

}
