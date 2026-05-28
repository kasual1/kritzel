import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-workspace-management-tab-bar',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav>
      @for (ws of workspaces(); track ws.id) {
        <button
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >{{ ws.name }}</button>
      }
    </nav>
    <kritzel-editor
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
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    nav {
      display: flex;
      gap: 4px;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      overflow-x: auto;
    }
    nav button {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      white-space: nowrap;
    }
    nav button.active {
      background: #dd0031;
      color: #fff;
      border-color: #dd0031;
    }
    kritzel-editor {
      flex: 1;
    }
  `,
})
export class WorkspaceManagementTabBarComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
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
