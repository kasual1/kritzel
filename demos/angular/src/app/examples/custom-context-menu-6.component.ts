import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ContextMenuItem, KritzelAlignment } from 'kritzel-stencil';

@Component({
  selector: 'app-custom-context-menu-6',
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
export class CustomContextMenu6Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

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
      label: 'Order',
      icon: 'layers',
      group: 'arrange',
      children: [
        {
          label: 'Bring to Front',
          action: () => {
            this.editor.bringToFront();
          },
        },
        {
          label: 'Bring Forward',
          action: () => {
            this.editor.bringForward();
          },
        },
        {
          label: 'Send Backward',
          action: () => {
            this.editor.sendBackward();
          },
        },
        {
          label: 'Send to Back',
          action: () => {
            this.editor.sendToBack();
          },
        },
      ],
    },
    {
      label: 'Align',
      icon: 'align-left',
      group: 'arrange',
      children: [
        {
          label: 'Align Left',
          action: () => {
            this.editor.alignObjects(KritzelAlignment.StartHorizontal);
          },
        },
        {
          label: 'Align Center',
          action: () => {
            this.editor.alignObjects(KritzelAlignment.CenterHorizontal);
          },
        },
        {
          label: 'Align Right',
          action: () => {
            this.editor.alignObjects(KritzelAlignment.EndHorizontal);
          },
        },
      ],
      disabled: (_menu, objects) => objects.length < 2,
    },
    {
      label: 'Delete',
      action: () => {
        this.editor.delete();
      },
      icon: 'trash',
      group: 'destructive',
    },
  ];
}
