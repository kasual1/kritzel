import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  ContextMenuItem,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-custom-context-menu-canvas-quick-actions',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="custom-context-menu-canvas-quick-actions"
      [wheelEnabled]="false"
      #editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="[]"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onEditorReady()"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomContextMenuCanvasQuickActionsComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  globalItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      action: async (menu) => {
        this.editor.paste(menu.x, menu.y);
      },
      icon: 'paste',
    },
    {
      label: 'Select All',
      action: () => {
        this.editor.selectAllObjectsInViewport();
      },
      icon: 'select-all',
    },
  ];

  async onEditorReady(): Promise<void> {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    await this.editor.openContextMenu({ x: -50, y: -50 });
  }
}
