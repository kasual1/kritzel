import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor, ContextMenuItem, KritzelSyncConfig, EditorIsReadyEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-custom-context-menu-smart-conditional',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editor
      editorId="custom-context-menu-smart-conditional"
      [theme]="'light'"
      [themes]="themes"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
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
export class CustomContextMenuSmartConditionalComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: []
  };

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
    },
    {
      label: 'Export as PNG',
      action: () => {
        this.editor.exportSelectedObjectsAsPng();
      },
      icon: 'download',
      group: 'export',
      visible: async (_menu, objects) => objects.length === 1,
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

  

  private async seedObjects() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
