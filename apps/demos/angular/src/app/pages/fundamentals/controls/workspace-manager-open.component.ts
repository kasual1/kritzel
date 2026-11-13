import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { UpdrawEditor, UpdrawSyncConfig, UpdrawWorkspace, InMemorySyncProvider } from '@updraw/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-workspace-manager-open',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-panel">
      <label class="checkbox-control">
        <input type="checkbox" [checked]="isWorkspaceManagerVisible()" (change)="setWorkspaceManagerVisible($event)" />
        <span>Workspace manager</span>
      </label>
    </div>
    <updraw-editor
      editorId="workspace-manager-open"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [syncConfig]="syncConfig"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isWorkspaceManagerVisible]="isWorkspaceManagerVisible()"
      (isReady)="onReady()"
    ></updraw-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .control-panel { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .checkbox-control { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #333; cursor: pointer; }
    updraw-editor { flex: 1; }
  `,
})
export class WorkspaceManagerOpenComponent {
  editor = viewChild(UpdrawEditor);

  isWorkspaceManagerVisible = signal(true);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  syncConfig: UpdrawSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  async onReady(): Promise<void> {
    await this.editor()?.openWorkspaceManagerMenu();
  }

  setWorkspaceManagerVisible(event: Event): void {
    this.isWorkspaceManagerVisible.set((event.target as HTMLInputElement).checked);
  }
}