import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  ActiveWorkspaceChangeEvent,
  InMemorySyncProvider,
  UpdrawEditor,
  UpdrawSyncConfig,
  UpdrawWorkspace,
} from '@updraw/angular-editor';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-workspaces-create',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="addWorkspace()">Add Workspace</button>
      @for (workspace of workspaces(); track workspace.id) {
        <button
          [class.active]="workspace.id === activeWorkspaceId()"
          (click)="switchTo(workspace)"
        >
          {{ workspace.name }}
        </button>
      }
    </app-toolbar>
    <updraw-editor
      editorId="workspaces-create"
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
    ></updraw-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      updraw-editor {
        flex: 1;
      }
    `,
  ],
})
export class WorkspacesCreateComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: UpdrawSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<UpdrawWorkspace[]>([
    new UpdrawWorkspace({
      id: 'board-1',
      name: 'Board 1',
      objects: createSeedObjects(),
    }),
  ]);
  activeWorkspaceId = signal<string | undefined>('board-1');

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  async addWorkspace() {
    const workspaceNumber = this.workspaces().length + 1;
    const workspace = await this.editor.createWorkspace(
      new UpdrawWorkspace({
        id: `board-${workspaceNumber}`,
        name: `Board ${workspaceNumber}`,
        objects: createSeedObjects(),
      }),
    );

    if (workspace) {
      this.workspaces.update((workspaces) => [...workspaces, workspace]);
      this.activeWorkspaceId.set(workspace.id);
    }
  }

  async switchTo(workspace: UpdrawWorkspace) {
    await this.editor.setActiveWorkspace(workspace.id);
  }
}