import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelShape } from 'kritzel-angular';
import { KzEditor } from 'kritzel-stencil';

@Component({
  selector: 'app-objects-query',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 8px; padding: 8px; background: #eee; flex-direction: column;">
      <div>
        <button (click)="queryAll()">Get All Count</button>
        <button (click)="findRed()">Find Red Shapes Count</button>
      </div>
      <div>Result: {{ result() }}</div>
    </div>
    <div style="flex: 1; height: 400px; position: relative;">
      <kritzel-editor (editorIsReady)="onEditorReady($event)"></kritzel-editor>
    </div>
  `
})
export class ObjectsQueryComponent {
  private editor!: KzEditor;
  result = signal<string>('N/A');

  async onEditorReady(event: EditorIsReadyEvent) {
    this.editor = event.detail.engine;
    
    // add some initial objects
    await this.editor.addObject(new KritzelShape({ x: 50, y: 50, width: 50, height: 50, shapeType: 'ellipse', backgroundColor: '#ff0000' }));
    await this.editor.addObject(new KritzelShape({ x: 150, y: 50, width: 50, height: 50, shapeType: 'ellipse', backgroundColor: '#00ff00' }));
  }

  async queryAll() {
    if (!this.editor) return;
    const allObjects = await this.editor.getAllObjects();
    this.result.set(\`Total objects: \${allObjects.length}\`);
  }

  async findRed() {
    if (!this.editor) return;
    const redShapes = await this.editor.findObjects(
      (obj) => obj instanceof KritzelShape && obj.backgroundColor === '#ff0000'
    );
    this.result.set(\`Red shapes: \${redShapes.length}\`);
  }
}
