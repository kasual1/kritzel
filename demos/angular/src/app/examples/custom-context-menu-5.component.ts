import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ContextMenuItem } from 'kritzel-stencil';

@Component({
  selector: 'app-custom-context-menu-5',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editor
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
export class CustomContextMenu5Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  globalItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      action: async (menu) => {
        this.editor.paste(menu.x, menu.y);
      },
      disabled: async () => (await this.editor.getCopiedObjects()).length === 0,
    },
    {
      label: 'Select All',
      action: () => {
        this.editor.selectAllObjectsInViewport();
      },
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
      label: 'Export as PNG',
      action: () => {
        this.editor.exportSelectedObjectsAsPng();
      },
      icon: 'download',
      group: 'export',
      visible: async (_menu, objects) => {
        return objects.length === 1;
      },
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
