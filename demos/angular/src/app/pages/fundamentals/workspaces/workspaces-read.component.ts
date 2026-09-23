import {
  ChangeDetectionStrategy,
  computed,
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
import {
  InfoPanelComponent,
  InfoPanelToggleComponent,
} from '../../../components/info-panel.component';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-workspaces-read',
  imports: [
    KritzelEditor,
    InfoPanelComponent,
    InfoPanelToggleComponent,
    ToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="addWorkspace()">Add Workspace</button>
      <span class="separator"></span>
      @for (workspace of workspaces(); track workspace.id) {
        <button
          [class.active]="workspace.id === activeWorkspaceId()"
          (click)="switchTo(workspace)"
        >
          {{ workspace.name }}
        </button>
      }
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>
    <div class="content">
      <kritzel-editor
        editorId="workspaces-read"
        [theme]="'light'"
        [themes]="themes"
        [syncConfig]="syncConfig"
        [workspaces]="workspaces()"
        [activeWorkspaceId]="activeWorkspaceId()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady()"
        (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
      ></kritzel-editor>
      <app-info-panel #infoPanel>
        <h3>Active Workspace</h3>
        <pre>{{ activeWorkspaceJson() }}</pre>
      </app-info-panel>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      .content {
        display: flex;
        flex: 1;
        min-height: 0;
        position: relative;
      }
      kritzel-editor {
        flex: 1;
      }
      app-info-panel {
        --demo-info-panel-width: 300px;
      }
      pre {
        margin: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.45;
      }
    `,
  ],
})
export class WorkspacesReadComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<KritzelWorkspace[]>([
    new KritzelWorkspace({
      id: 'board-1',
      name: 'Board 1',
      objects: createSeedObjects(),
    }),
  ]);
  activeWorkspaceId = signal<string | undefined>('board-1');
  activeWorkspace = signal<KritzelWorkspace | null>(null);
  activeWorkspaceJson = computed(() => {
    const workspace = this.activeWorkspace();
    return workspace
      ? JSON.stringify(workspace.serialize({ includeObjects: true }), null, 2)
      : '';
  });

  async onReady() {
    await this.refreshActiveWorkspace();
  }

  async addWorkspace() {
    const workspaceNumber = this.workspaces().length + 1;
    const workspace = await this.editor.createWorkspace(
      new KritzelWorkspace({
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

  async switchTo(workspace: KritzelWorkspace) {
    await this.editor.setActiveWorkspace(workspace.id);
  }

  async onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
    await this.refreshActiveWorkspace();
  }

  async refreshActiveWorkspace() {
    this.activeWorkspace.set(await this.editor.getActiveWorkspace());
  }
}