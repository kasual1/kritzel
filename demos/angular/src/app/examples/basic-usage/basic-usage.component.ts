import { Component, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { KritzelText } from 'kritzel-angular';

@Component({
  selector: 'app-basic-usage',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="demo-container">
      <div class="toolbar">
        <button (click)="setBrushTool()">🖌️ Brush</button>
        <button (click)="setSelectTool()">🖱️ Select</button>
        <button (click)="addText()">📝 Add Text</button>
        <button (click)="undoAction()">↩️ Undo</button>
        <button (click)="zoomIn()">🔍 Zoom In</button>
        <span class="status">{{ status }}</span>
      </div>
      <kritzel-editor
        #editor
        style="width: 100%; height: 400px; display: block; border: 1px solid #ccc; border-radius: 8px;"
        (isReady)="onReady()"
        (objectsChange)="onObjectsChange($event)"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
    .demo-container { display: flex; flex-direction: column; gap: 8px; }
    .toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    button { padding: 6px 12px; cursor: pointer; border-radius: 6px; border: 1px solid #ddd; background: #fff; }
    button:hover { background: #f5f5f5; }
    .status { margin-left: auto; font-size: 14px; color: #666; font-weight: 500; }
  `]
})
export class BasicUsageComponent {
  @ViewChild('editor') editorRef!: ElementRef<any>;
  status = 'Loading...';

  get editor() {
    return this.editorRef?.nativeElement;
  }

  onReady() {
    this.status = 'Editor is ready!';
  }

  onObjectsChange(event: Event) {
    const detail = (event as CustomEvent).detail;
    this.status = `Objects count: ${detail.objects?.length || 0}`;
  }

  async setBrushTool() {
    await this.editor?.changeActiveToolByName('brush');
  }

  async setSelectTool() {
    await this.editor?.changeActiveToolByName('select');
  }

  async addText() {
    if (!this.editor) return;
    const text = new KritzelText({
      value: 'Hello Canvas!',
      translateX: 200,
      translateY: 200,
      fontSize: 32,
      fontColor: '#0055ff'
    });
    await this.editor.addObject(text);
    await this.editor.selectObjects([text]);
  }

  async undoAction() {
    await this.editor?.undo();
  }

  async zoomIn() {
    await this.editor?.zoomTo(1.5);
  }
}
