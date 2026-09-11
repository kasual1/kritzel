import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  KritzelTheme,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-theming-apply',
  imports: [KritzelEditor, ToolbarComponent],
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
      <kritzel-editor
        editorId="theming-apply"
        [theme]="activeName"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="true"
        (isReady)="onIsReady($event)"
      ></kritzel-editor>
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
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes: KritzelTheme[] = [angularThemeLight, angularThemeDark];
  activeName: string = 'light';

  

  async onIsReady(_event: CustomEvent) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
