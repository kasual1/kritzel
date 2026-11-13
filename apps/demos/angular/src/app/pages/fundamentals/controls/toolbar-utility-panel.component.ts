import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UpdrawEditor, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-toolbar-utility-panel',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-panel">
      <label class="checkbox-control">
        <input type="checkbox" [checked]="isToolbarVisible()" (change)="setToolbarVisible($event)" />
        <span>Toolbar</span>
      </label>
      <label class="checkbox-control">
        <input type="checkbox" [checked]="isUtilityPanelVisible()" (change)="setUtilityPanelVisible($event)" />
        <span>Utility panel</span>
      </label>
    </div>
    <updraw-editor
      editorId="toolbar-utility-panel"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isToolbarVisible]="isToolbarVisible()"
      [isUtilityPanelVisible]="isUtilityPanelVisible()"
    ></updraw-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .control-panel { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .checkbox-control { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #333; cursor: pointer; }
    updraw-editor { flex: 1; }
  `,
})
export class ToolbarUtilityPanelComponent {
  isToolbarVisible = signal(true);
  isUtilityPanelVisible = signal(true);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  setToolbarVisible(event: Event): void {
    this.isToolbarVisible.set((event.target as HTMLInputElement).checked);
  }

  setUtilityPanelVisible(event: Event): void {
    this.isUtilityPanelVisible.set((event.target as HTMLInputElement).checked);
  }
}