import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  ContextMenuItem,
  KritzelSyncConfig,
  EditorIsReadyEvent,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-custom-context-menu-object-inspector',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="custom-context-menu-object-inspector"
      [wheelEnabled]="false"
      #editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onIsReady($event)"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomContextMenuObjectInspectorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

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
      label: 'Parent',
      group: 'arrange',
      children: [
        {
          label: 'Child 1',
          action: () => {
            window.alert('Child 1 clicked');
          },
        },
        {
          label: 'Child 2',
          children: [
            {
              label: 'Grandchild 1',
              action: () => {
                window.alert('Grandchild 1 clicked');
              },
            },
            {
              label: 'Grandchild 2',
              action: () => {
                window.alert('Grandchild 2 clicked');
              },
            },
          ],
        },
        {
          label: 'Child 3',
          action: () => {
            window.alert('Child 3 clicked');
          },
        },
      ],
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

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    await this.editor.selectAllObjectsInViewport();

    const selected = await this.editor.getSelectedObjects();

    await this.editor.openContextMenu({
      x: selected[0].translateX + 50,
      y: selected[0].translateY + 50,
      objectId: selected[0].id,
    });
  }
}
