import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  ActiveWorkspaceChangeEvent,
  InMemorySyncProvider,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-persistence-memory',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      @for (workspace of workspaces(); track workspace.id) {
        <button
          [class.active]="workspace.id === activeWorkspaceId()"
          (click)="switchTo(workspace)"
        >
          {{ workspace.name }}
        </button>
      }
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="persistence-memory"
        [syncConfig]="syncConfig"
        [workspaces]="workspaces()"
        [activeWorkspaceId]="activeWorkspaceId()"
        [theme]="'light'"
        [themes]="themes"
        [loginConfig]="undefined"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
      ></kritzel-editor>
    </div>
  `,
  styles: [
    `
      :host {
        --angular-primary: #dd0031;
        --angular-primary-hover: #b30027;
        --angular-text: #333333;
        --angular-border: #ebebeb;
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
        color: var(--angular-text);
        background: linear-gradient(180deg, #fff8f9 0%, #ffffff 100%);
      }

      .status {
        font-size: 12px;
        color: var(--angular-primary-hover);
        border: 1px solid #f1bdc9;
        background: #fff5f7;
        padding: 3px 8px;
        border-radius: 999px;
      }

      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class PersistenceMemoryComponent {
  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  workspaces = signal<KritzelWorkspace[]>([
    new KritzelWorkspace({ id: 'board-1', name: 'Board 1', objects: createSeedObjects() }),
    new KritzelWorkspace({ id: 'board-2', name: 'Board 2', objects: createSeedObjects() }),
    new KritzelWorkspace({ id: 'board-3', name: 'Board 3', objects: createSeedObjects() }),
  ]);
  activeWorkspaceId = signal<string | undefined>('board-1');

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }
}
