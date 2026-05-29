import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelShape } from 'kritzel-angular';
import { KzEditor } from 'kritzel-stencil';

@Component({
  selector: 'app-objects-grouping',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 8px; padding: 8px; background: #eee;">
      <button (click)="groupAll()">Group All</button>
      <button (click)="bringToFront()">Bring Blue To Front</button>
    </div>
    <div style="flex: 1; height: 400px; position: relative;">
      <kritzel-editor (editorIsReady)="onEditorReady($event)"></kritzel-editor>
    </div>
  `
})
export class ObjectsGroupingComponent {
  private editor!: KzEditor;
  private blueShapeId!: string;

  async onEditorReady(event: EditorIsReadyEvent) {
    this.editor = event.detail.engine;
    
    // Add red shape first (bottom)
    await this.editor.addObject(new KritzelShape({ x: 50, y: 50, width: 80, height: 80, shapeType: 'rectangle', backgroundColor: '#ff0000' }));
    
    // Add blue shape second (middle)
    const blueShape = new KritzelShape({ x: 80, y: 80, width: 80, height: 80, shapeType: 'rectangle', backgroundColor: '#0000ff' });
    await this.editor.addObject(blueShape);
    this.blueShapeId = blueShape.id;

    // Add green shape third (top)
    await this.editor.addObject(new KritzelShape({ x: 110, y: 110, width: 80, height: 80, shapeType: 'rectangle', backgroundColor: '#00ff00' }));
  }

  async groupAll() {
    if (!this.editor) return;
    const all = await this.editor.getAllObjects();
    await this.editor.group(all);
  }

  async bringToFront() {
    if (!this.editor) return;
    await this.editor.bringToFront(this.blueShapeId);
  }
}
