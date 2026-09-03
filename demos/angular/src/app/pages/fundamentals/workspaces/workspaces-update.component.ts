import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
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
  selector: 'app-workspaces-update',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <input
        aria-label="Workspace name"
        [value]="workspaceName()"
        (input)="setWorkspaceName($event)"
      />
      <button (click)="updateWorkspace()" [disabled]="!workspaceName().trim()">
        Rename Workspace
      </button>
      <span class="status">Current: {{ activeWorkspace()?.name }}</span>
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-update"
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
      (workspacesChange)="refreshActiveWorkspace()"
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
export class WorkspacesUpdateComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  activeWorkspace = signal<KritzelWorkspace | null>(null);
  workspaceName = signal('Project Board');

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.refreshActiveWorkspace();

    for (const object of createSeedObjects()) {
      await this.editor.addObject(object);
    }
  }

  setWorkspaceName(event: Event) {
    this.workspaceName.set((event.target as HTMLInputElement).value);
  }

  async updateWorkspace() {
    const workspace = this.activeWorkspace()?.clone();
    const name = this.workspaceName().trim();
    if (!workspace || !name) return;

    workspace.name = name;
    await this.editor.updateWorkspace(workspace);
  }

  async refreshActiveWorkspace() {
    this.activeWorkspace.set(await this.editor.getActiveWorkspace());
  }
}