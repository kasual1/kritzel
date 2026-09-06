import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  ActiveWorkspaceChangeEvent,
  EditorIsReadyEvent,
  InMemorySyncProvider,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelWorkspace,
} from 'kritzel-angular';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-workspaces-create',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="createWorkspace()">Create Workspace</button>
      @for (workspace of workspaces(); track workspace.id) {
        <button
          [class.active]="workspace.id === activeWorkspaceId()"
          (click)="switchTo(workspace)"
        >
          {{ workspace.name }}
        </button>
      }
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-create"
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [activeWorkspaceId]="activeWorkspaceId()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
      (workspacesChange)="refreshWorkspaces()"
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
    `,
  ],
})
export class WorkspacesCreateComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    await this.refreshWorkspaces();
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);

    for (const object of createSeedObjects()) {
      await this.editor.addObject(object);
    }
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  async createWorkspace() {
    const workspaceNumber = this.workspaces().length + 1;
    const workspace = await this.editor.createWorkspace(new KritzelWorkspace({ name: `Board ${workspaceNumber}` }));

    if (workspace) {
      await this.switchTo(workspace);
    }
  }

  async switchTo(workspace: KritzelWorkspace) {
    await this.editor.setActiveWorkspace(workspace.id);
  }

  async refreshWorkspaces() {
    this.workspaces.set(await this.editor.getWorkspaces());
  }
}