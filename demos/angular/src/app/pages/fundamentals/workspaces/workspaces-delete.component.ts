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
  selector: 'app-workspaces-delete',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="deleteWorkspace()" [disabled]="workspaces().length < 2">
        Delete {{ workspaceToDelete()?.name }}
      </button>
      <span class="status">{{ workspaces().length }} workspaces</span>
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-delete"
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
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
export class WorkspacesDeleteComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<KritzelWorkspace[]>([]);

  workspaceToDelete() {
    return this.workspaces().at(-1);
  }

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.refreshWorkspaces();

    if (this.workspaces().length < 2) {
      await this.editor.createWorkspace(new KritzelWorkspace({ name: 'Temporary Board' }));
    }

    for (const object of createSeedObjects()) {
      await this.editor.addObject(object);
    }
  }

  async deleteWorkspace() {
    const workspace = this.workspaceToDelete();
    if (!workspace || this.workspaces().length < 2) return;

    await this.editor.deleteWorkspace(workspace);
  }

  async refreshWorkspaces() {
    this.workspaces.set(await this.editor.getWorkspaces());
  }
}