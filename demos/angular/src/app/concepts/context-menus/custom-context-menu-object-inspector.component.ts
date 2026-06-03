import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  ContextMenuItem,
  InMemorySyncProvider,
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
      [syncConfig]="syncConfig"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
      [loginConfig]="undefined"
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

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedObjects();
    }

    await this.editor.selectAllObjectsInViewport();

    const selected = await this.editor.getSelectedObjects();

    await this.editor.openContextMenu({
      x: selected[0].translateX + 50,
      y: selected[0].translateY + 50,
      objectId: selected[0].id,
    });
  }

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
      label: 'Arrange',
      icon: 'layers',
      group: 'arrange',
      children: [
        {
          label: 'Bring to Front',
          icon: 'bring-to-front',
          action: () => {
            this.editor.bringToFront();
          },
        },
        {
          label: 'Bring Forward',
          icon: 'bring-forward',
          action: () => {
            this.editor.bringForward();
          },
        },
        {
          label: 'Send Backward',
          icon: 'send-backward',
          action: () => {
            this.editor.sendBackward();
          },
        },
        {
          label: 'Send to Back',
          icon: 'send-to-back',
          action: () => {
            this.editor.sendToBack();
          },
        },
      ],
    },
    {
      label: 'Export',
      icon: 'download',
      group: 'export',
      children: [
        {
          label: 'Export as PNG',
          action: () => {
            this.editor.exportSelectedObjectsAsPng();
          },
        },
        {
          label: 'Export as SVG',
          action: () => {
            this.editor.exportSelectedObjectsAsSvg();
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

  private async seedObjects() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
