import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelShape } from 'kritzel-angular';
import { KzEditor } from 'kritzel-stencil';

@Component({
  selector: 'app-objects-selection',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 8px; padding: 8px; background: #eee;">
      <button (click)="logSelection()">Log Selection Count</button>
      <button (click)="selectAll()">Select All</button>
      <button (click)="clearSelection()">Clear Selection</button>
    </div>
    <div style="flex: 1; height: 400px; position: relative;">
      <kritzel-editor (editorIsReady)="onEditorReady($event)"></kritzel-editor>
    </div>
  `
})
export class ObjectsSelectionComponent {
  private editor!: KzEditor;

  async onEditorReady(event: EditorIsReadyEvent) {
    this.editor = event.detail.engine;
    await this.editor.addObject(new KritzelShape({ x: 50, y: 50, width: 50, height: 50, shapeType: 'rectangle' }));
    await this.editor.addObject(new KritzelShape({ x: 150, y: 50, width: 50, height: 50, shapeType: 'rectangle' }));
  }

  async logSelection() {
    if (!this.editor) return;
    const selected = await this.editor.getSelectedObjects();
    alert('Selected: ' + selected.length);
  }

  async selectAll() {
    if (!this.editor) return;
    const all = await this.editor.getAllObjects();
    await this.editor.selectObjects(all);
  }

  async clearSelection() {
    if (!this.editor) return;
    await this.editor.clearSelection();
  }
}
