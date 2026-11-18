import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DEFAULT_BRUSH_CONFIG,
  UpmadeBrushTool,
  UpmadeEditor,
  UpmadeSelectionTool,
  UpmadeSyncConfig,
  UpmadeTextTool,
  UpmadeToolbarItem,
  UpmadeWorkspace,
} from '@upmade/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-tools-toolbar',
  imports: [UpmadeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <upmade-editor
      editorId="tools-toolbar"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [toolbarItems]="toolbarItems"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></upmade-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class ToolsToolbarComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpmadeWorkspace({ objects: createSeedObjects() })]);

  toolbarItems: UpmadeToolbarItem[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: UpmadeSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: UpmadeBrushTool,
      icon: 'pen',
      isDefault: true,
    },
    {
      name: 'text',
      type: 'tool',
      tool: UpmadeTextTool,
      icon: 'type',
    },
    {
      name: 'config',
      type: 'config'
    }
  ];

}
