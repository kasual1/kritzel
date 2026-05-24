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
      label: 'Parent 1',
      action: async (menu) => {
        window.alert(`Parent 1`);
      },
    },
    {
      label: 'Parent 2',
      action: () => {
        window.alert(`Parent 2`);
      },
    },
     {
      label: 'Parent 3',
      children: [
        {
          label: 'Child 1',
        },
        {
          label: 'Child 2',
        },
         {
          label: 'Child 3',
          children: [
            {
              label: 'Subchild 1',
              action: () => {
                this.editor.bringForward();
              }
            },
            {
              label: 'Subchild 2',
              action: () => {
                this.editor.bringForward();
              }
            }
          ]
        },
      ],
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
      label: 'Delete',
      action: () => {
        this.editor.delete();
      },
      icon: 'trash',
      group: 'destructive',
    },
  ];
}
