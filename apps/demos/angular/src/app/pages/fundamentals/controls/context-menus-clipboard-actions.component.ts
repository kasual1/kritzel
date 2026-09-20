import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  ContextMenuItem,
  KritzelBaseObject,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-context-menus-clipboard-actions',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editor
      editorId="custom-context-menu-clipboard-actions"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (objectsChange)="onObjectsChange($event)"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class ContextMenusClipboardActionsComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);
  private hasOpenedContextMenu = false;

  globalItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      action: async (menu) => {
        this.editor.paste(menu.x, menu.y);
      },
      icon: 'paste',
      group: 'clipboard',
    },
    {
      label: 'Select All',
      action: () => {
        this.editor.selectAllObjectsInViewport();
      },
      icon: 'selectAll',
      group: 'clipboard',
    },
  ];

  objectItems: ContextMenuItem[] = [
    {
      label: 'Copy',
      action: () => {
        this.editor.copy();
      },
      icon: 'copy',
      group: 'clipboard',
    },
    {
      label: 'Paste',
      action: async (menu) => {
        this.editor.paste(menu.x, menu.y);
      },
      icon: 'paste',
      group: 'clipboard',
    },
    {
      label: 'Delete',
      action: () => {
        this.editor.delete();
      },
      icon: 'delete',
      group: 'destructive',
    },
  ];

  async onObjectsChange(event: CustomEvent<KritzelBaseObject[]>) {
    if (this.hasOpenedContextMenu || event.detail.length === 0) return;

    this.hasOpenedContextMenu = true;
    await this.editor.selectAllObjectsInViewport();
    const target = event.detail[0];

    await this.editor.openContextMenu({
      x: target.translateX + 50,
      y: target.translateY + 50,
    });
  }
}
