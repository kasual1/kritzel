import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import {
  KritzelBrushTool,
  KritzelBrushToolConfig,
  KritzelEditor,
  KritzelSelectionTool,
  EditorIsReadyEvent,
  KritzelSyncConfig,
  KritzelTextTool,
  KritzelToolbarControl,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

const highlighterConfig: KritzelBrushToolConfig = {
  type: 'highlighter',
  color: { light: '#ffeb3b', dark: '#fff176' },
  size: 20,
  palettes: {
    highlighter: [
      { light: '#ffeb3b', dark: '#fff176', label: 'Yellow' },
      { light: '#76ff03', dark: '#b2ff59', label: 'Green' },
    ],
  },
};

@Component({
  selector: 'app-tools-register',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="tools-register"
      [theme]="'light'"
      [themes]="themes"
      [controls]="controls"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      kritzel-editor {
        flex: 1;
      }
      .status-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-top: 1px solid #ebebeb;
        font-size: 13px;
      }
    `,
  ],
})
export class ToolsRegisterComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

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
      name: 'highlighter',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'highlighter',
      config: {
        type: 'highlighter',
        color: { light: '#ffeb3b', dark: '#fff176' },
        size: 20,
        opacity: 0.6,
        palettes: {
          highlighter: [
            { light: '#ffeb3b', dark: '#fff176', label: 'Yellow' },
            { light: '#76ff03', dark: '#b2ff59', label: 'Green' },
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

  

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }

    await this.editor.registerTool(
      'highlighter',
      KritzelBrushTool,
      highlighterConfig,
    );
  }
}
