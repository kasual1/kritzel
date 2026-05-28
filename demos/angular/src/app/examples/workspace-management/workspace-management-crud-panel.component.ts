import { ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild, ViewChildren, QueryList, AfterViewChecked } from '@angular/core';
import { KritzelEditor, ActiveWorkspaceChangeEvent, EditorIsReadyEvent, KritzelWorkspace, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-workspace-management-crud-panel',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav>
      @for (ws of workspaces(); track ws.id) {
        <div class="tab" [class.active]="ws.id === activeWorkspaceId()">
          @if (editingId() === ws.id) {
            <input
              class="tab-input"
              [value]="ws.name"
              (keydown.enter)="confirmRename($event)"
              (keydown.escape)="cancelRename()"
              #renameInput
            />
            <button class="tab-action" (click)="confirmRename($event)">✓</button>
          } @else {
            <button class="tab-label" (click)="switchTo(ws)">{{ ws.name }}</button>
            <button class="tab-action" (click)="startRename(ws, $event)">✎</button>
            <button
              class="tab-action"
              [disabled]="workspaces().length <= 1"
              (click)="remove(ws, $event)"
            >✕</button>
          }
        </div>
      }
      <button class="add-btn" (click)="addWorkspace()">+ New Board</button>
    </nav>
    <kritzel-editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [activeWorkspaceId]="activeWorkspaceId()"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      border-bottom: 1px solid #ddd;
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
    .tab-input {
      padding: 6px 8px;
      border: none;
      outline: none;
      font-family: inherit;
      font-size: inherit;
      width: 120px;
    }
    .tab-input::selection {
      background: rgba(221, 0, 49, 0.2);
      color: inherit;
    }
    .add-btn {
      padding: 6px 12px;
      border: 1px dashed #aaa;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      white-space: nowrap;
    }
    kritzel-editor {
      flex: 1;
    }
  `,
})
export class WorkspaceManagementCrudPanelComponent implements AfterViewChecked {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChildren('renameInput') renameInputs!: QueryList<ElementRef<HTMLInputElement>>;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  workspaces = signal<KritzelWorkspace[]>([]);
  activeWorkspaceId = signal<string | undefined>(undefined);
  editingId = signal<string | null>(null);

  private focusPending = false;

  ngAfterViewChecked() {
    if (this.focusPending && this.renameInputs.length > 0) {
      this.renameInputs.first.nativeElement.select();
      this.focusPending = false;
    }
  }

  async onReady(event: CustomEvent<EditorIsReadyEvent>) {
    this.workspaces.set(await this.editor.getWorkspaces());
    this.activeWorkspaceId.set(event.detail.activeWorkspace.id);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }

  async addWorkspace() {
    const workspace = new KritzelWorkspace(crypto.randomUUID(), 'New Board');
    await this.editor.createWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
    this.switchTo(workspace);
  }

  startRename(workspace: KritzelWorkspace, event: MouseEvent) {
    event.stopPropagation();
    this.editingId.set(workspace.id);
    this.focusPending = true;
  }

  async confirmRename(event?: Event) {
    const inputEl = this.renameInputs.first?.nativeElement;
    if (!inputEl) return;
    const newName = inputEl.value.trim();
    const id = this.editingId();
    this.editingId.set(null);
    if (!newName || !id) return;
    const workspace = this.workspaces().find(ws => ws.id === id);
    if (!workspace || workspace.name === newName) return;
    workspace.name = newName;
    await this.editor.updateWorkspace(workspace);
    this.workspaces.set(await this.editor.getWorkspaces());
  }

  cancelRename() {
    this.editingId.set(null);
  }

  async remove(workspace: KritzelWorkspace, event: MouseEvent) {
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
