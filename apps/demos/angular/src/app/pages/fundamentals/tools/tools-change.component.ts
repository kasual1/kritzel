import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { UpdrawEditor, UpdrawSyncConfig, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

type ToolName = 'select' | 'brush' | 'eraser' | 'line' | 'shape' | 'text';

@Component({
  selector: 'app-tools-change',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      @for (tool of tools; track tool.name) {
        <button
          [class.active]="activeTool() === tool.name"
          (click)="setTool(tool.name)"
        >
          {{ tool.label }}
        </button>
      }
    </app-toolbar>
    <updraw-editor
      editorId="tools-change"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isToolbarVisible]="false"
    ></updraw-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    updraw-editor { flex: 1; }
    .status-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; }
  `],
})
export class ToolsChangeComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  activeTool = signal<ToolName>('select');

  tools: { name: ToolName; label: string }[] = [
    { name: 'select', label: 'Select' },
    { name: 'brush', label: 'Brush' },
    { name: 'eraser', label: 'Eraser' },
    { name: 'line', label: 'Line' },
    { name: 'shape', label: 'Shape' },
    { name: 'text', label: 'Text' },
  ];

  async setTool(name: ToolName) {
    this.activeTool.set(name);
    await this.editor.setActiveTool(name);
  }
}
