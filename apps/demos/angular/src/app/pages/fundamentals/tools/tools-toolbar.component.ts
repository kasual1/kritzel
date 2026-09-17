import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  DEFAULT_BRUSH_CONFIG,
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelSyncConfig,
  KritzelTextTool,
  KritzelToolbarItem,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-tools-toolbar',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="tools-toolbar"
      [theme]="'light'"
      [themes]="themes"
      [toolbarItems]="toolbarItems"
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
export class ToolsToolbarComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  toolbarItems: KritzelToolbarItem[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      isDefault: true,
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
    },
    {
      name: 'config',
      type: 'config'
    }
  ];

  async onReady() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
