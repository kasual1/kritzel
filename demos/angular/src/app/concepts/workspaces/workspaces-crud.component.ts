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
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-workspaces-crud',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      @for (ws of workspaces(); track ws.id) {
        <div class="tab" [class.active]="ws.id === activeWorkspaceId()">
          <button class="tab-label" (click)="switchTo(ws)">
            {{ ws.name }}
          </button>
          @if (workspaces().length > 1) {
            <button class="tab-action" (click)="deleteWorkspace(ws, $event)">
              ✕
            </button>
          }
        </div>
      }
      <button class="add-btn" (click)="createWorkspace()">+ New</button>
    </div>
    <kritzel-editor
      editorId="workspaces-crud"
      [theme]="'angular-theme'"
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
      .toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #ebebeb;
        overflow-x: auto;
      }
      .tab {
        display: flex;
        align-items: center;
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
      }
      .tab.active {
        border-color: #dd0031;
      }
      .tab-label {
        padding: 6px 8px;
        border: none;
        background: #fff;
        cursor: pointer;
        white-space: nowrap;
        font-size: 13px;
      }
      .tab.active .tab-label {
        background: #dd0031;
        color: #fff;
      }
      .tab-action {
        padding: 4px 6px;
        border: none;
        border-left: 1px solid #eee;
        background: #fff;
        cursor: pointer;
        font-size: 12px;
      }
      .tab-action:disabled {
        opacity: 0.3;
        cursor: default;
      }
      .add-btn {
        padding: 6px 12px;
        border: 1px dashed #aaa;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        white-space: nowrap;
        font-size: 13px;
      }
      kritzel-editor {
        flex: 1;
      }
    `,
  ],
})
export class WorkspacesCrudComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);

  private workspaceCounter = 1;

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);

    this.editor.activeWorkspaceId = this.activeWorkspaceId();

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

  async createWorkspace() {
    this.workspaceCounter++;
    const workspace = new KritzelWorkspace(
      crypto.randomUUID(),
      `Board ${this.workspaceCounter}`,
    );
    await this.editor.createWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
    this.switchTo(workspace);
  }

  async deleteWorkspace(workspace: KritzelWorkspace, event: MouseEvent) {
    event.stopPropagation();
    const wasActive = workspace.id === this.activeWorkspaceId();
    await this.editor.deleteWorkspace(workspace);
    const remaining = await this.editor.getWorkspaces();
    this.workspaces.set(remaining);
    if (wasActive && remaining.length > 0) {
      this.switchTo(remaining[0]);
    }
  }
}
