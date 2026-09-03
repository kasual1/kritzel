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
  selector: 'app-workspaces-read',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="readWorkspaces()">Read Workspaces</button>
      <span class="status">Active: {{ activeWorkspace()?.name }}</span>
      <span class="status">Total: {{ workspaces().length }}</span>
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-read"
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
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
export class WorkspacesReadComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspace = signal<KritzelWorkspace | null>(null);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.readWorkspaces();

    for (const object of createSeedObjects()) {
      await this.editor.addObject(object);
    }
  }

  async readWorkspaces() {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspace.set(await this.editor.getActiveWorkspace());
  }
}