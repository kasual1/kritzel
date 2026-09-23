import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  ActiveWorkspaceChangeEvent,
  InMemorySyncProvider,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { LucideX } from '@lucide/angular';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-workspaces-delete',
  imports: [KritzelEditor, LucideX, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      @for (workspace of workspaces(); track workspace.id) {
        <div
          class="workspace-tab"
          [class.active]="workspace.id === activeWorkspaceId()"
          (click)="switchTo(workspace)"
        >
          <span>{{ workspace.name }}</span>
          @if (workspaces().length > 1) {
            <button
              class="delete-workspace"
              type="button"
              [attr.aria-label]="'Delete ' + workspace.name"
              (click)="deleteWorkspace(workspace, $event)"
            >
              <svg lucideX [size]="14" [strokeWidth]="2.5"></svg>
            </button>
          }
        </div>
      }
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-delete"
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [workspaces]="workspaces()"
      [activeWorkspaceId]="activeWorkspaceId()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
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
      .workspace-tab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
      }
      .workspace-tab:hover,
      .workspace-tab.active {
        border-color: #dd0031;
      }
      .workspace-tab.active {
        background: #dd0031;
        color: #fff;
      }
      .delete-workspace {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .delete-workspace:hover {
        color: #7a001b;
      }
    `,
  ],
})
export class WorkspacesDeleteComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<KritzelWorkspace[]>(
    Array.from(
      { length: 6 },
      (_, index) =>
        new KritzelWorkspace({
          id: `board-${index + 1}`,
          name: `Board ${index + 1}`,
          objects: createSeedObjects(),
        }),
    ),
  );
  activeWorkspaceId = signal<string | undefined>('board-1');

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  async switchTo(workspace: KritzelWorkspace) {
    await this.editor.setActiveWorkspace(workspace.id);
  }

  async deleteWorkspace(workspace: KritzelWorkspace, event: MouseEvent) {
    event.stopPropagation();
    const currentWorkspaces = this.workspaces();
    if (currentWorkspaces.length <= 1) return;

    const remainingWorkspaces = currentWorkspaces.filter(
      (candidate) => candidate.id !== workspace.id,
    );
    const shouldSelectFirstWorkspace = workspace.id === this.activeWorkspaceId();

    await this.editor.deleteWorkspace(workspace);
    this.workspaces.set(remainingWorkspaces);

    if (shouldSelectFirstWorkspace) {
      const firstWorkspace = remainingWorkspaces[0];
      this.activeWorkspaceId.set(firstWorkspace.id);
      await this.editor.setActiveWorkspace(firstWorkspace.id);
    }
  }
}