import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelSyncConfig,
  KritzelTextTool,
  KritzelToolbarControl,
  InMemorySyncProvider,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-tools-controls',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="tools-controls"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [controls]="controls"
      [loginConfig]="undefined"
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
export class ToolsControlsComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  controls: KritzelToolbarControl[] = [
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
        type: 'pen',
        color: { light: '#1f2937', dark: '#f3f4f6' },
        size: 6,
        palettes: {
          pen: [
            { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
            { light: '#dd0031', dark: '#ff5b79', label: 'Accent' },
          ],
        },
      },
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: { light: '#1f2937', dark: '#f3f4f6' },
        size: 18,
        fontFamily: 'Arial',
        palette: [
          { light: '#1f2937', dark: '#f3f4f6' },
          { light: '#dd0031', dark: '#ff5b79' },
        ],
      },
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
