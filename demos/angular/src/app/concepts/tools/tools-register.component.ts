import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelBrushToolConfig,
  EditorIsReadyEvent,
  InMemorySyncProvider,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-tools-register',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="registerRedPen()">Register Red Pen</button>
      <button (click)="registerHighlighter()">Register Highlighter</button>
      <button (click)="activateCustomTool('red-pen')" [disabled]="!registeredTools().has('red-pen')">
        Use Red Pen
      </button>
      <button (click)="activateCustomTool('highlighter')" [disabled]="!registeredTools().has('highlighter')">
        Use Highlighter
      </button>
      <button (click)="activateSelect()">Select</button>
    </div>
    <kritzel-editor
      editorId="tools-register"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isControlsVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
    <div class="status-bar">
      Registered: {{ registeredToolNames() }}
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover:not(:disabled) { background: #dd0031; color: #fff; border-color: #dd0031; }
    .toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
    kritzel-editor { flex: 1; }
    .status-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; }
  `],
})
export class ToolsRegisterComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  registeredTools = signal<Set<string>>(new Set());

  registeredToolNames(): string {
    const names = [...this.registeredTools()];
    return names.length > 0 ? names.join(', ') : 'none';
  }

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {}

  async registerRedPen() {
    const config: KritzelBrushToolConfig = {
      type: 'pen',
      color: { light: '#e53935', dark: '#ef5350' },
      size: 4,
      palettes: {
        pen: [
          { light: '#e53935', dark: '#ef5350', label: 'Red' },
          { light: '#d81b60', dark: '#ec407a', label: 'Pink' },
        ],
      },
    };
    await this.editor.registerTool('red-pen', KritzelBrushTool, config);
    this.registeredTools.update(set => new Set([...set, 'red-pen']));
  }

  async registerHighlighter() {
    const config: KritzelBrushToolConfig = {
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
    await this.editor.registerTool('highlighter', KritzelBrushTool, config);
    this.registeredTools.update(set => new Set([...set, 'highlighter']));
  }

  async activateCustomTool(name: string) {
    await this.editor.changeActiveToolByName(name);
  }

  async activateSelect() {
    await this.editor.changeActiveToolByName('select');
  }
}
