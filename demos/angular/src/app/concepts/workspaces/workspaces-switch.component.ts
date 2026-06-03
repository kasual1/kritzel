import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';

@Component({
  selector: 'app-workspaces-switch',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      @for (ws of workspaces(); track ws.id) {
        <button
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >{{ ws.name }}</button>
      }
    </div>
    <kritzel-editor
      editorId="workspaces-switch"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [activeWorkspaceId]="activeWorkspaceId()"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .toolbar button.active { background: #dd0031; color: #fff; border-color: #dd0031; }
    kritzel-editor { flex: 1; }
  `],
})
export class WorkspacesSwitchComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }
}
