import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ContextMenuItem } from 'kritzel-stencil';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-custom-context-menu-4',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomContextMenu4Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  globalItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      action: async (menu) => {
        this.editor.paste(menu.x, menu.y);
      },
      icon: 'paste',
      group: 'clipboard',
      disabled: async () => (await this.editor.getCopiedObjects()).length === 0,
    },
    {
      label: 'Select All',
      action: () => {
        this.editor.selectAllObjectsInViewport();
      },
      icon: 'select-all',
      group: 'clipboard',
      disabled: async () => (await this.editor.getObjectsInViewport()).length === 0,
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
      disabled: async () => (await this.editor.getCopiedObjects()).length === 0,
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
}
