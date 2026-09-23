import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  ContextMenuItem,
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelToolbarItem,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-icons-register-new',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="icons-register-new"
      [customSvgIcons]="customSvgIcons"
      [toolbarItems]="toolbarItems"
      [workspaces]="workspaces()"
      [globalContextMenuItems]="globalItems"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      kritzel-editor {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class IconsRegisterNewComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);
  
  customSvgIcons = {
    alien:
      '<svg width=\"800px\" height=\"800px\" viewBox=\"0 0 128 128\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" aria-hidden=\"true\" role=\"img\" class=\"iconify iconify--noto\" preserveAspectRatio=\"xMidYMid meet\"><path fill=\"#995aa8\" d=\"M30.47 104.24h13.39v13.39H30.47z\"/><path fill=\"#995aa8\" d=\"M84.04 104.24h13.39v13.39H84.04z\"/><path fill=\"#b574c3\" d=\"M30.48 10.51h13.39V23.9H30.48z\"/><path fill=\"#b574c3\" d=\"M84.0410.51h13.39V23.9H84.04z\"/><radialGradient id=\"IconifyId17ecdb2904d178eab5528\" cx=\"64.344\" cy=\"9.403\" r=\"83.056\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".508\" stop-color=\"#b574c3\"/><stop offset=\".684\" stop-color=\"#b070bf\"/><stop offset=\".878\" stop-color=\"#a363b2\"/><stop offset=\".981\" stop-color=\"#995aa8\"/></radialGradient><path d=\"M97.46 64.08V37.3H84.04V23.9H70.65v13.4H57.26V23.9H43.87v13.4H30.48v26.78H17.09v13.39h13.39v13.4h13.39v13.38h13.39V90.87h13.39v13.38h13.39V90.87h13.42v-13.4h13.37V64.08H97.46zm-40.21 0H43.86V50.69h13.39v13.39zm26.78 0H70.64V50.69h13.39v13.39z\" fill=\"url(#IconifyId17ecdb2904d178eab5528)\"/><radialGradient id=\"IconifyId17ecdb2904d178eab5529\" cx=\"63.118\" cy=\"24.114\" r=\"65.281\"gradientUnits=\"userSpaceOnUse\"><stop offset=\".508\" stop-color=\"#b574c3\"/><stop offset=\".684\" stop-color=\"#b070bf\"/><stop offset=\".878\" stop-color=\"#a363b2\"/><stop offset=\".981\" stop-color=\"#995aa8\"/></radialGradient><path fill=\"url(#IconifyId17ecdb2904d178eab5529)\" d=\"M110.82 37.29h13.4v26.8h-13.4z\"/><radialGradient id=\"IconifyId17ecdb2904d178eab5530\" cx=\"62.811\" cy=\"13.081\" r=\"75.09\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".508\" stop-color=\"#b574c3\"/><stop offset=\".684\" stop-color=\"#b070bf\"/><stop offset=\".878\" stop-color=\"#a363b2\"/><stop offset=\".981\" stop-color=\"#995aa8\"/></radialGradient><path fill=\"url(#IconifyId17ecdb2904d178eab5530)\" d=\"M3.7 37.28h13.4v26.8H3.7z\"/></svg>',
  };

  globalItems: ContextMenuItem[] = [
    { label: 'Alien icon', icon: 'alien', action: () => undefined },
  ];

  toolbarItems: KritzelToolbarItem[] = [
    {
      name: 'select',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
      isDefault: true,
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      config: {
        color: { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
        size: 8,
        opacity: 1,
        palette: [
          { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
          { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
          { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
        ],
        sizes: [4, 8, 16],
      },
    },
    {
      name: 'alien',
      icon: 'alien',
      type: 'tool',
    },
  ];

  async onReady() {
    await this.editor.openContextMenu({ x: -50, y: -50 });
  }
}
