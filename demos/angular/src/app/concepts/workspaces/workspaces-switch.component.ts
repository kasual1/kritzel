import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KritzelEditor, KritzelWorkspace } from 'kritzel-angular';

@Component({
  selector: 'app-workspaces-switch',
  standalone: true,
  imports: [CommonModule, KritzelEditor],
  template: `
    <div class="demo-container">
      <div class="sidebar">
        <h3>Workspaces</h3>
        <ul>
          <li *ngFor="let ws of workspaces" 
              [class.active]="ws.id === activeWorkspaceId"
              (click)="switchWorkspace(ws.id)">
            {{ ws.name || 'Workspace ' + ws.id }}
          </li>
        </ul>
      </div>
      <div class="editor-area">
        <kritzel-editor
          [isWorkspaceManagerVisible]="false"
          [activeWorkspaceId]="activeWorkspaceId"
          (editorReady)="onEditorReady($event)"
          (activeWorkspaceChange)="onWorkspaceChange($event)"
        ></kritzel-editor>
      </div>
    </div>
  `,
  styles: [`
    .demo-container { display: flex; height: 400px; gap: 1rem; }
    .sidebar { width: 200px; background: #f5f5f5; padding: 1rem; border-radius: 8px; }
    .sidebar ul { list-style: none; padding: 0; }
    .sidebar li { padding: 0.5rem; cursor: pointer; border-radius: 4px; margin-bottom: 0.25rem; }
    .sidebar li:hover { background: #e0e0e0; }
    .sidebar li.active { background: #d0e0ff; font-weight: bold; }
    .editor-area { flex: 1; border: 1px solid #ccc; border-radius: 8px; overflow: hidden; }
  `]
})
export class WorkspacesSwitchComponent {
  editor: KritzelEditor | null = null;
  workspaces: KritzelWorkspace[] = [];
  activeWorkspaceId: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  async onEditorReady(editor: any) {
    this.editor = editor;
    // Create initial workspaces manually for the demo
    const ws1 = await this.editor.createWorkspace({ name: 'Sketchpad 1' });
    const ws2 = await this.editor.createWorkspace({ name: 'Sketchpad 2' });
    
    if (ws1) {
      this.activeWorkspaceId = ws1.id;
    }
    await this.loadWorkspaces();
  }

  async loadWorkspaces() {
    this.workspaces = await this.editor.getWorkspaces();
    this.cdr.detectChanges();
  }

  switchWorkspace(id: string) {
    this.activeWorkspaceId = id;
  }
  
  onWorkspaceChange(event: any) {
    if (event && event.detail) {
      this.activeWorkspaceId = event.detail.id;
      this.cdr.detectChanges();
    }
  }
}
