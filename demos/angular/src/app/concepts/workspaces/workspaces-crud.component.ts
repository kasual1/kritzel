import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KritzelEditor, KritzelWorkspace } from 'kritzel-angular';

@Component({
  selector: 'app-workspaces-crud',
  standalone: true,
  imports: [CommonModule, KritzelEditor],
  template: `
    <div class="demo-container">
      <div class="sidebar">
        <h3>Manage Workspaces</h3>
        <button class="add-btn" (click)="addWorkspace()">+ New Workspace</button>
        <ul>
          <li *ngFor="let ws of workspaces" 
              [class.active]="ws.id === activeWorkspaceId"
              (click)="activeWorkspaceId = ws.id">
            <input *ngIf="editingId === ws.id" 
                   [value]="ws.name" 
                   (blur)="saveName(ws, $any($event.target).value)" 
                   (keyup.enter)="saveName(ws, $any($event.target).value)" 
                   autofocus>
            <span *ngIf="editingId !== ws.id" (dblclick)="editName(ws.id)">
              {{ ws.name || 'Untitled' }}
            </span>
            <button class="del-btn" (click)="deleteWorkspace(ws, $event)">X</button>
          </li>
        </ul>
      </div>
      <div class="editor-area">
        <kritzel-editor
          [isWorkspaceManagerVisible]="false"
          [activeWorkspaceId]="activeWorkspaceId"
          (editorReady)="onEditorReady($event)"
          (workspacesChange)="onWorkspacesChange($event)"
          (activeWorkspaceChange)="onWorkspaceChange($event)"
        ></kritzel-editor>
      </div>
    </div>
  `,
  styles: [`
    .demo-container { display: flex; height: 400px; gap: 1rem; }
    .sidebar { width: 220px; background: #f5f5f5; padding: 1rem; border-radius: 8px; }
    .add-btn { width: 100%; padding: 0.5rem; margin-bottom: 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .sidebar ul { list-style: none; padding: 0; }
    .sidebar li { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; cursor: pointer; border-radius: 4px; margin-bottom: 0.25rem; }
    .sidebar li:hover { background: #e0e0e0; }
    .sidebar li.active { background: #d0e0ff; font-weight: bold; }
    .sidebar input { width: 120px; }
    .del-btn { background: red; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 2px 6px; }
    .editor-area { flex: 1; border: 1px solid #ccc; border-radius: 8px; overflow: hidden; }
  `]
})
export class WorkspacesCrudComponent {
  editor: KritzelEditor | null = null;
  workspaces: KritzelWorkspace[] = [];
  activeWorkspaceId: string | null = null;
  editingId: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  onEditorReady(editor: any) {
    this.editor = editor;
  }

  onWorkspacesChange(event: any) {
    // The event detail contains the array of current workspaces
    if (event && event.detail) {
      this.workspaces = event.detail;
      this.cdr.detectChanges();
    }
  }

  onWorkspaceChange(event: any) {
    if (event && event.detail) {
      this.activeWorkspaceId = event.detail.id;
      this.cdr.detectChanges();
    }
  }

  async addWorkspace() {
    if (!this.editor) return;
    // const ws = await this.editor.createWorkspace();
    // if (ws) {
    //   this.activeWorkspaceId = ws.id;
    // }
  }

  editName(id: string) {
    this.editingId = id;
  }

  async saveName(ws: KritzelWorkspace, newName: string) {
    if (!this.editor || !this.editingId) return;
    ws.name = newName;
    await this.editor.updateWorkspace(ws);
    this.editingId = null;
  }

  async deleteWorkspace(ws: KritzelWorkspace, evt: Event) {
    if (!this.editor) return;
    evt.stopPropagation();
    await this.editor.deleteWorkspace(ws);
  }
}
