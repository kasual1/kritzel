import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  ActiveWorkspaceChangeEvent,
  EditorIsReadyEvent,
  KritzelWorkspace,
  KritzelSyncConfig,
  InMemorySyncProvider,
} from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-workspaces-switch',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      @for (ws of workspaces(); track ws.id) {
        <button
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >
          {{ ws.name }}
        </button>
      }
    </app-toolbar>
    <kritzel-editor
      editorId="workspaces-switch"
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
export class WorkspacesSwitchComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);

    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }
}
