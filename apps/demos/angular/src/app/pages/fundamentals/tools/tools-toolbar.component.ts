import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DEFAULT_BRUSH_CONFIG,
  UpdrawBrushTool,
  UpdrawEditor,
  UpdrawSelectionTool,
  UpdrawSyncConfig,
  UpdrawTextTool,
  UpdrawToolbarItem,
  UpdrawWorkspace,
} from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-tools-toolbar',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <updraw-editor
      editorId="tools-toolbar"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [toolbarItems]="toolbarItems"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></updraw-editor>
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

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  toolbarItems: UpdrawToolbarItem[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: UpdrawSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: UpdrawBrushTool,
      icon: 'pen',
      isDefault: true,
    },
    {
      name: 'text',
      type: 'tool',
      tool: UpdrawTextTool,
      icon: 'type',
    },
    {
      name: 'config',
      type: 'config'
    }
  ];

}
