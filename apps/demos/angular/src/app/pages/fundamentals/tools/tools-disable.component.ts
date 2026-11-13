import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  UpdrawBrushTool,
  UpdrawEditor,
  UpdrawEraserTool,
  UpdrawSelectionTool,
  UpdrawToolbarItem,
  UpdrawWorkspace,
} from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-tools-disable',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="toggle()">
        {{ isEraserDisabled() ? 'Enable eraser tool' : 'Disable eraser tool' }}
      </button>
    </app-toolbar>
    <updraw-editor
      editorId="tools-disable"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [toolbarItems]="toolbarItems()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></updraw-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    updraw-editor { flex: 1; }
  `],
})
export class ToolsDisableComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  isEraserDisabled = signal(true);

  toolbarItems = computed<UpdrawToolbarItem[]>(() => {
    const isEraserDisabled = this.isEraserDisabled();

    return [
      {
        name: 'selection',
        type: 'tool',
        isDefault: true,
        tool: UpdrawSelectionTool,
        icon: 'cursor',
      },
      {
        name: 'brush',
        type: 'tool',
        tool: UpdrawBrushTool,
        icon: 'pen',
      },
      {
        name: 'eraser',
        type: 'tool',
        tool: UpdrawEraserTool,
        icon: 'eraser',
        // Demonstrates the function form of `isDisabled` for dynamic, state-driven control.
        isDisabled: () => isEraserDisabled,
      },
      {
        name: 'config',
        type: 'config',
      },
    ];
  });

  toggle() {
    this.isEraserDisabled.update(value => !value);
  }
}
