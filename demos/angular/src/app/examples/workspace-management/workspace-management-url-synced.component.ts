import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KritzelEditor, ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-workspace-management-url-synced',
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
      <button class="add-btn" (click)="addWorkspace()">+ New Board</button>
    </nav>
    <kritzel-editor
      editorId="workspace-management-url-synced"
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
    .add-btn {
      border-style: dashed;
      border-color: #aaa;
      background: transparent;
    }
    kritzel-editor {
      flex: 1;
    }
  `,
})
export class WorkspaceManagementUrlSyncedComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    const idFromUrl = this.route.snapshot.params['workspaceId'];
    if (idFromUrl) {
      this.activeWorkspaceId.set(idFromUrl);
    }
  }

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    if (!this.activeWorkspaceId()) {
      this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
    }
    this.syncUrl(this.activeWorkspaceId()!);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
    this.syncUrl(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }

  async addWorkspace() {
    const workspace = new KritzelWorkspace(crypto.randomUUID(), 'New Board');
    await this.editor.createWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
    this.switchTo(workspace);
  }

  private syncUrl(workspaceId: string) {
    this.router.navigate(['../', workspaceId], { relativeTo: this.route, replaceUrl: true });
  }
}
