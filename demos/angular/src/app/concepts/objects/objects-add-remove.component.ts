import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelShape } from 'kritzel-angular';
import { KzEditor } from 'kritzel-stencil';

@Component({
  selector: 'app-objects-add-remove',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 8px; padding: 8px; background: #eee;">
      <button (click)="addShape()">Add Shape</button>
      <button (click)="removeShape()" [disabled]="!lastShapeId">Remove Shape</button>
    </div>
    <div style="flex: 1; height: 400px; position: relative;">
      <kritzel-editor (editorIsReady)="onEditorReady($event)"></kritzel-editor>
    </div>
  `
})
export class ObjectsAddRemoveComponent {
  private editor!: KzEditor;
  lastShapeId: string | null = null;

  async onEditorReady(event: EditorIsReadyEvent) {
    this.editor = event.detail.engine;
  }

  async addShape() {
    if (!this.editor) return;
    const newShape = new KritzelShape({
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      width: 50,
      height: 50,
      shapeType: 'rectangle',
      backgroundColor: '#ff0000'
    });
    await this.editor.addObject(newShape);
    this.lastShapeId = newShape.id;
  }

  async removeShape() {
    if (!this.editor || !this.lastShapeId) return;
    await this.editor.removeObject(this.lastShapeId);
    this.lastShapeId = null;
  }
}
