import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

type ToolName = 'select' | 'brush' | 'eraser' | 'line' | 'shape' | 'text';

@Component({
  selector: 'app-tools-change',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      @for (tool of tools; track tool.name) {
        <button
          [class.active]="activeTool() === tool.name"
          (click)="setTool(tool.name)"
        >
          {{ tool.label }}
        </button>
      }
    </div>
    <kritzel-editor
      editorId="tools-change"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isControlsVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
    <div class="status-bar">
      Active tool: <strong>{{ activeTool() }}</strong>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .toolbar button.active { background: #dd0031; color: #fff; border-color: #dd0031; }
    kritzel-editor { flex: 1; }
    .status-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; }
  `],
})
export class ToolsChangeComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  activeTool = signal<ToolName>('select');

  tools: { name: ToolName; label: string }[] = [
    { name: 'select', label: 'Select' },
    { name: 'brush', label: 'Brush' },
    { name: 'eraser', label: 'Eraser' },
    { name: 'line', label: 'Line' },
    { name: 'shape', label: 'Shape' },
    { name: 'text', label: 'Text' },
  ];

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  async setTool(name: ToolName) {
    this.activeTool.set(name);
    await this.editor.changeActiveToolByName(name);
  }
}
