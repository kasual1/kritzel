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
  selector: 'app-workspaces-create',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="createWorkspace()">Create Workspace</button>
      <span class="status">{{ workspaces().length }} workspaces</span>
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-create"
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
export class WorkspacesCreateComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<KritzelWorkspace[]>([]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.refreshWorkspaces();

    for (const object of createSeedObjects()) {
      await this.editor.addObject(object);
    }
  }

  async createWorkspace() {
    const workspaceNumber = this.workspaces().length + 1;
    await this.editor.createWorkspace({
      name: `Board ${workspaceNumber}`,
    });
  }

  async refreshWorkspaces() {
    this.workspaces.set(await this.editor.getWorkspaces());
  }
}