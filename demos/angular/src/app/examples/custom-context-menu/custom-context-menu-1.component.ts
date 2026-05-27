import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ContextMenuItem } from 'kritzel-stencil';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-custom-context-menu-1',
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
export class CustomContextMenu1Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  globalItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      action: async (menu) => {
        this.editor.paste(menu.x, menu.y);
      },
    },
    {
      label: 'Select All',
      action: () => {
        this.editor.selectAllObjectsInViewport();
      },
    },
  ];

  objectItems: ContextMenuItem[] = [];
}
