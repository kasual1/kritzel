import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  ContextMenuItem,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-context-menus-canvas-quick-actions',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editor
      editorId="custom-context-menu-canvas-quick-actions"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="[]"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class ContextMenusCanvasQuickActionsComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

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
      icon: 'selectAll',
    },
  ];

  async onReady(): Promise<void> {
    await this.editor.openContextMenu({ x: -50, y: -50 });
  }
}
